import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { GET as getIncubators } from "@/app/api/v1/incubators/route";
import { db } from "@/lib/kysely";
import { sql } from "kysely";

// revalidatePath exige le contexte de rendu de Next, absent en mocha : meme
// stub que dans test-startups.ts.
const { PATCH: patchStartup } = proxyquire(
  "@/app/api/v1/startups/[id]/route",
  { "next/cache": { revalidatePath: sinon.stub() } },
) as typeof import("@/app/api/v1/startups/[id]/route");

import {
  apiRequest,
  apiWriteRequest,
  createTestApiKey,
  deleteTestApiKey,
} from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const testData: FakeDataInterface = {
  incubators: [{ ghid: "scope-incub", title: "Scope Incubateur" }],
  startups: [
    { ghid: "scope-startup", name: "Scope Produit", incubator: "scope-incub" },
  ],
  users: [],
};

const mergePatch = (token: string, body: unknown) =>
  apiWriteRequest(
    token,
    "http://localhost/api/v1/startups/scope-startup",
    "PATCH",
    "application/merge-patch+json",
    body,
  );

describe("api v1 scopes", () => {
  const created: string[] = [];
  let startupUuid: string;

  const makeKey = async (
    scopes: Parameters<typeof createTestApiKey>[0]["scopes"],
    write?: { kind: "startup"; uuid: string },
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
        .where("ghid", "=", "scope-startup")
        .executeTakeFirstOrThrow()
    ).uuid;
  });

  after(async () => {
    for (const uuid of created) await deleteTestApiKey(uuid);
    // Les ecritures ont emis des events references par action_on_startup.
    await db.deleteFrom("events").execute();
    await deleteData(testData);
  });

  it("answers 403 insufficient_scope without the required scope", async () => {
    const key = await makeKey(["members:read"]);
    const res = await getIncubators(
      apiRequest(key.token, "http://localhost/api/v1/incubators"),
      { params: Promise.resolve({}) },
    );
    expect(res.status).to.equal(403);
    const body = await res.json();
    expect(body.type).to.match(/insufficient-scope$/);
    expect(body.required_scope).to.equal("incubators:read");
    expect(res.headers.get("www-authenticate")).to.include("insufficient_scope");
  });

  // Aucune implication entre portees : une ecriture repond 204 sans la lecture
  // correspondante, 200 avec.
  it("answers 204 without a body when the key holds only startups:write", async () => {
    const key = await makeKey(["startups:write"], {
      kind: "startup",
      uuid: startupUuid,
    });
    const res = await patchStartup(mergePatch(key.token, { pitch: "204" }), {
      params: Promise.resolve({ id: "scope-startup" }),
    });
    expect(res.status).to.equal(204);
    expect(await res.text()).to.equal("");
  });

  it("answers 200 with the representation when the key also holds startups:read", async () => {
    const key = await makeKey(["startups:write", "startups:read"], {
      kind: "startup",
      uuid: startupUuid,
    });
    const res = await patchStartup(mergePatch(key.token, { pitch: "200" }), {
      params: Promise.resolve({ id: "scope-startup" }),
    });
    expect(res.status).to.equal(200);
    const body = await res.json();
    expect(body.data.pitch).to.equal("200");
  });

  it("never lets incubators:write imply incubators:read", async () => {
    const key = await makeKey(["incubators:write"], {
      kind: "startup",
      uuid: startupUuid,
    });
    const res = await getIncubators(
      apiRequest(key.token, "http://localhost/api/v1/incubators"),
      { params: Promise.resolve({}) },
    );
    expect(res.status).to.equal(403);
  });

  it("answers 415 on a write with the wrong media type", async () => {
    const key = await makeKey(["startups:write"], {
      kind: "startup",
      uuid: startupUuid,
    });
    const res = await patchStartup(
      apiWriteRequest(
        key.token,
        "http://localhost/api/v1/startups/scope-startup",
        "PATCH",
        "application/json",
        {},
      ),
      { params: Promise.resolve({ id: "scope-startup" }) },
    );
    expect(res.status).to.equal(415);
  });

  /**
   * Un scope hors enumeration dans une clef existante fait echouer le parse zod
   * de toApiKeyContext : la clef est rejetee en 401 invalid_token, jamais en
   * 500, et le rejet tombe AVANT touchApiKey.
   */
  it("rejects a key carrying an unknown scope in 401, before touchApiKey", async () => {
    const key = await makeKey(["startups:read"]);
    // chk_api_keys_scopes interdit ce scope : on le contourne le temps de
    // simuler une clef creee avant qu'un scope ne soit retire de l'enumeration.
    await sql`alter table api_keys drop constraint chk_api_keys_scopes`.execute(
      db,
    );
    await db
      .updateTable("api_keys")
      .set({ scopes: ["startups:read", "startups:teleport"] })
      .where("uuid", "=", key.uuid)
      .execute();
    await sql`alter table api_keys add constraint chk_api_keys_scopes check (array_length(scopes, 1) >= 1 and scopes <@ array['members:read','startups:read','incubators:read','startups:write','incubators:write']::text[]) not valid`.execute(
      db,
    );

    const before = await db
      .selectFrom("api_keys")
      .select("last_used_at")
      .where("uuid", "=", key.uuid)
      .executeTakeFirstOrThrow();

    const res = await getIncubators(
      apiRequest(key.token, "http://localhost/api/v1/incubators"),
      { params: Promise.resolve({}) },
    );
    expect(res.status).to.equal(401);
    const body = await res.json();
    expect(body.status).to.equal(401);
    expect(res.headers.get("www-authenticate")).to.include("invalid_token");

    const after = await db
      .selectFrom("api_keys")
      .select("last_used_at")
      .where("uuid", "=", key.uuid)
      .executeTakeFirstOrThrow();
    expect(after.last_used_at, "last_used_at a bouge").to.deep.equal(
      before.last_used_at,
    );
  });
});
