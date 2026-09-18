import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import { GET as getIncubator } from "@/app/api/v1/incubators/[id]/route";
import { GET as getStartups } from "@/app/api/v1/startups/route";
import { db } from "@/lib/kysely";

import { apiRequest, createTestApiKey, deleteTestApiKey } from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();

// Produit co-incube A+B, plus un produit qui n'appartient qu'a B : c'est ce jeu
// qui distingue un EXISTS d'un innerJoin.
const testData: FakeDataInterface = {
  incubators: [
    { ghid: "perim-incub-a", title: "Perimetre A" },
    { ghid: "perim-incub-b", title: "Perimetre B" },
  ],
  startups: [
    {
      ghid: "perim-shared",
      name: "Produit co-incube",
      incubator: "perim-incub-a",
      incubators: ["perim-incub-b"],
    },
    {
      ghid: "perim-only-b",
      name: "Produit de B seul",
      incubator: "perim-incub-b",
    },
  ],
  users: [
    {
      username: "perim-member",
      role: "Developpeuse",
      missions: [
        {
          start: subDays(now, 30),
          end: addDays(now, 30),
          startups: ["perim-shared"],
        },
      ],
    },
  ],
};

type ApiStartup = { uuid: string; ghid: string; incubators: { ghid: string }[] };

describe("api v1 perimeters", () => {
  let incubatorA: { uuid: string };
  let keyOnA: { token: string; uuid: string };
  let globalKey: { token: string; uuid: string };

  const listStartups = async (token: string) => {
    const res = await getStartups(
      apiRequest(token, "http://localhost/api/v1/startups?limit=100"),
      { params: Promise.resolve({}) },
    );
    expect(res.status).to.equal(200);
    return (await res.json()) as {
      data: ApiStartup[];
      meta: { total: number; perimeter: string };
    };
  };

  before(async () => {
    await createData(testData);
    incubatorA = await db
      .selectFrom("incubators")
      .select("uuid")
      .where("ghid", "=", "perim-incub-a")
      .executeTakeFirstOrThrow();
    keyOnA = await createTestApiKey({
      scopes: ["startups:read", "incubators:read"],
      read: { kind: "incubator", uuid: incubatorA.uuid },
    });
    globalKey = await createTestApiKey({
      scopes: ["startups:read", "incubators:read"],
    });
  });

  after(async () => {
    await deleteTestApiKey(keyOnA.uuid);
    await deleteTestApiKey(globalKey.uuid);
    await deleteData(testData);
  });

  it("never answers 403 on a collection, it just narrows it", async () => {
    const body = await listStartups(keyOnA.token);
    const ghids = body.data.map((startup) => startup.ghid);
    expect(ghids).to.include("perim-shared");
    expect(ghids, "un produit hors perimetre est present").to.not.include(
      "perim-only-b",
    );
  });

  /**
   * LE test du lot : un innerJoin sur startups_incubators ferait remonter le
   * produit co-incube une fois par incubateur lie, et DISTINCT est impossible
   * puisque la projection porte des agregats json.
   */
  it("never duplicates a co-incubated product", async () => {
    const body = await listStartups(globalKey.token);
    const occurrences = body.data.filter(
      (startup) => startup.ghid === "perim-shared",
    );
    expect(occurrences, "produit co-incube duplique").to.have.length(1);

    const uuids = body.data.map((startup) => startup.uuid);
    expect(new Set(uuids).size, "doublons dans la collection").to.equal(
      uuids.length,
    );
    // total est compte sur la meme base que la page : il doit suivre.
    expect(body.meta.total).to.equal(body.data.length);
  });

  // Le perimetre filtre des LIGNES, jamais des colonnes.
  it("returns the co-incubated product whole, with B in incubators[]", async () => {
    const body = await listStartups(keyOnA.token);
    const shared = body.data.find(
      (startup) => startup.ghid === "perim-shared",
    )!;
    expect(shared, "produit co-incube absent").to.exist;
    const linked = shared.incubators.map((incubator) => incubator.ghid).sort();
    expect(linked).to.deep.equal(["perim-incub-a", "perim-incub-b"]);
  });

  it("exposes the perimeter as a ghid in meta", async () => {
    const scoped = await listStartups(keyOnA.token);
    expect(scoped.meta.perimeter).to.equal("incubator/perim-incub-a");

    const global = await listStartups(globalKey.token);
    expect(global.meta.perimeter).to.equal("global");
  });

  // Les ghid sont publics sur beta.gouv.fr : un 404 masque ne protege rien et
  // ment au client.
  it("answers 403 and not 404 on a single resource out of perimeter", async () => {
    const res = await getIncubator(
      apiRequest(keyOnA.token, "http://localhost/api/v1/incubators/x"),
      { params: Promise.resolve({ id: "perim-incub-b" }) },
    );
    expect(res.status).to.equal(403);
    const body = await res.json();
    expect(body.type).to.match(/out-of-perimeter$/);
  });

  it("still answers 404 for an unknown identifier, before any perimeter check", async () => {
    const res = await getIncubator(
      apiRequest(keyOnA.token, "http://localhost/api/v1/incubators/x"),
      { params: Promise.resolve({ id: "incubateur-inexistant" }) },
    );
    expect(res.status).to.equal(404);
  });

  it("answers 200 on the incubator inside the perimeter", async () => {
    const res = await getIncubator(
      apiRequest(keyOnA.token, "http://localhost/api/v1/incubators/x"),
      { params: Promise.resolve({ id: "perim-incub-a" }) },
    );
    expect(res.status).to.equal(200);
  });

  // Perimetre startup/S : tous les incubateurs de S sont accessibles.
  it("lets a startup perimeter reach every incubator of that startup", async () => {
    const startup = await db
      .selectFrom("startups")
      .select("uuid")
      .where("ghid", "=", "perim-shared")
      .executeTakeFirstOrThrow();
    const key = await createTestApiKey({
      scopes: ["incubators:read"],
      read: { kind: "startup", uuid: startup.uuid },
    });

    for (const ghid of ["perim-incub-a", "perim-incub-b"]) {
      const res = await getIncubator(
        apiRequest(key.token, "http://localhost/api/v1/incubators/x"),
        { params: Promise.resolve({ id: ghid }) },
      );
      expect(res.status, ghid).to.equal(200);
    }

    await deleteTestApiKey(key.uuid);
  });
});
