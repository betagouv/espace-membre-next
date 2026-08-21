import { expect } from "chai";
import { NextRequest } from "next/server";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { db } from "@/lib/kysely";

import { apiWriteRequest, createTestApiKey, deleteTestApiKey } from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

// revalidatePath exige le contexte de rendu de Next, absent en mocha.
const cacheStub = { "next/cache": { revalidatePath: sinon.stub() } };
const { PATCH: patchStartup } = proxyquire(
  "@/app/api/v1/startups/[id]/route",
  cacheStub,
) as typeof import("@/app/api/v1/startups/[id]/route");
const { PATCH: patchIncubator } = proxyquire(
  "@/app/api/v1/incubators/[id]/route",
  cacheStub,
) as typeof import("@/app/api/v1/incubators/[id]/route");
const { PUT: putStandards } = proxyquire(
  "@/app/api/v1/startups/[id]/standards/route",
  cacheStub,
) as typeof import("@/app/api/v1/startups/[id]/standards/route");

const testData: FakeDataInterface = {
  incubators: [{ ghid: "we-incub", title: "WE Incubateur" }],
  startups: [
    { ghid: "we-startup", name: "WE Produit", incubator: "we-incub" },
  ],
  users: [],
};

/** Corps volontairement non parsable : NextRequest, le wrapper lit nextUrl. */
const brokenBody = (token: string, url: string, contentType: string) =>
  new NextRequest(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: '{"pitch":',
  });

describe("api v1 write errors", () => {
  const created: string[] = [];
  let startupUuid: string;
  let incubatorUuid: string;

  const keyFor = async (
    scopes: Parameters<typeof createTestApiKey>[0]["scopes"],
    write: { kind: "incubator" | "startup"; uuid: string },
  ) => {
    const key = await createTestApiKey({ scopes, write });
    created.push(key.uuid);
    return key;
  };

  before(async () => {
    await createData(testData);
    startupUuid = (
      await db
        .selectFrom("startups")
        .select("uuid")
        .where("ghid", "=", "we-startup")
        .executeTakeFirstOrThrow()
    ).uuid;
    incubatorUuid = (
      await db
        .selectFrom("incubators")
        .select("uuid")
        .where("ghid", "=", "we-incub")
        .executeTakeFirstOrThrow()
    ).uuid;
  });

  after(async () => {
    for (const uuid of created) await deleteTestApiKey(uuid);
    await db.deleteFrom("events").execute();
    await deleteData(testData);
  });

  /**
   * req.json() leve un SyntaxError, qui n'est ni un ZodError ni une erreur pg :
   * sans traduction dans le filet du wrapper, le client recevait un 500 pour
   * une requete que LUI a mal formee, et Sentry recevait une alerte a chaque
   * fois.
   */
  it("answers 422 and not 500 on a malformed JSON body", async () => {
    const key = await keyFor(["startups:write", "startups:read"], {
      kind: "startup",
      uuid: startupUuid,
    });
    const res = await patchStartup(
      brokenBody(
        key.token,
        "http://localhost/api/v1/startups/we-startup",
        "application/merge-patch+json",
      ),
      { params: Promise.resolve({ id: "we-startup" }) },
    );
    expect(res.status).to.equal(422);
    const body = await res.json();
    expect(body.type).to.match(/invalid-request$/);
  });

  it("answers 422 and not 500 on an empty body sent as JSON", async () => {
    const key = await keyFor(["startups:write"], {
      kind: "startup",
      uuid: startupUuid,
    });
    const req = new NextRequest(
      "http://localhost/api/v1/startups/we-startup/standards",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${key.token}`,
          "Content-Type": "application/json",
        },
      },
    );
    const res = await putStandards(req, {
      params: Promise.resolve({ id: "we-startup" }),
    });
    expect(res.status).to.equal(422);
  });

  /**
   * Un merge-patch vide est valide (RFC 7396) et ne change rien. Sans
   * court-circuit, kysely emettait `update incubators set  where ...`, du SQL
   * invalide, donc un 500 sur un corps parfaitement legitime.
   */
  it("treats an empty merge-patch on an incubator as a no-op, not a 500", async () => {
    const key = await keyFor(["incubators:write", "incubators:read"], {
      kind: "incubator",
      uuid: incubatorUuid,
    });
    const res = await patchIncubator(
      apiWriteRequest(
        key.token,
        "http://localhost/api/v1/incubators/we-incub",
        "PATCH",
        "application/merge-patch+json",
        {},
      ),
      { params: Promise.resolve({ id: "we-incub" }) },
    );
    expect(res.status).to.equal(200);
    const body = await res.json();
    expect(body.data.ghid).to.equal("we-incub");
  });

  /**
   * techno, thematiques et usertypes sont des colonnes jsonb : un tableau JS
   * passe tel quel est serialise par pg en litteral de TABLEAU, refuse en 22P02
   * invalid input syntax for type json. Le PATCH rendait donc 500 sur les trois
   * seuls champs de liste du contrat.
   */
  it("writes the three jsonb list fields of a startup without a 500", async () => {
    const key = await keyFor(["startups:write", "startups:read"], {
      kind: "startup",
      uuid: startupUuid,
    });
    const res = await patchStartup(
      apiWriteRequest(
        key.token,
        "http://localhost/api/v1/startups/we-startup",
        "PATCH",
        "application/merge-patch+json",
        {
          techno: ["react", "node"],
          thematiques: ["numerique"],
          usertypes: ["agent"],
        },
      ),
      { params: Promise.resolve({ id: "we-startup" }) },
    );
    expect(res.status, "ecriture jsonb cassee").to.equal(200);
    const body = await res.json();
    expect(body.data.techno).to.deep.equal(["react", "node"]);
    expect(body.data.thematiques).to.deep.equal(["numerique"]);
    expect(body.data.usertypes).to.deep.equal(["agent"]);
  });

  // Le ghid n'est pas exposable en ecriture : zod le strippe, ce qui laisse un
  // patch vide, donc le meme piege.
  it("treats a patch carrying only non-writable fields as a no-op", async () => {
    const key = await keyFor(["incubators:write", "incubators:read"], {
      kind: "incubator",
      uuid: incubatorUuid,
    });
    const res = await patchIncubator(
      apiWriteRequest(
        key.token,
        "http://localhost/api/v1/incubators/we-incub",
        "PATCH",
        "application/merge-patch+json",
        { ghid: "nouveau-nom" },
      ),
      { params: Promise.resolve({ id: "we-incub" }) },
    );
    expect(res.status).to.equal(200);
    const body = await res.json();
    // Le ghid n'a pas bouge : l'API ne le laisse pas ecrire.
    expect(body.data.ghid).to.equal("we-incub");
  });
});
