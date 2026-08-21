import { expect } from "chai";
import { subDays } from "date-fns";

import { GET as listIncubatorMembers } from "@/app/api/v1/incubators/[id]/members/route";
import { db } from "@/lib/kysely";

import { apiRequest, createTestApiKey, deleteTestApiKey } from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();

// Un incubateur, deux produits, une personne sur chacun, plus une equipe de
// l'incubateur portant une troisieme personne. Une clef de perimetre
// startup/impm-startup-a ne doit voir que la premiere : les deux autres sont
// bien dans l'incubateur du chemin, mais hors du perimetre de la clef.
const testData: FakeDataInterface = {
  incubators: [
    { ghid: "impm-incub", title: "Perimetre membres" },
    { ghid: "impm-other", title: "Autre incubateur" },
  ],
  startups: [
    { ghid: "impm-startup-a", name: "Produit A", incubator: "impm-incub" },
    { ghid: "impm-startup-b", name: "Produit B", incubator: "impm-incub" },
    { ghid: "impm-startup-c", name: "Produit C", incubator: "impm-other" },
  ],
  teams: [{ ghid: "impm-team", name: "Equipe", incubator: "impm-incub" }],
  users: [
    {
      username: "impm-on-a",
      fullname: "Membre du produit A",
      missions: [
        {
          start: subDays(now, 30),
          end: subDays(now, -30),
          startups: ["impm-startup-a"],
        },
      ],
    },
    {
      username: "impm-on-b",
      fullname: "Membre du produit B",
      missions: [
        {
          start: subDays(now, 30),
          end: subDays(now, -30),
          startups: ["impm-startup-b"],
        },
      ],
    },
    {
      username: "impm-on-team",
      fullname: "Membre de l equipe",
      teams: ["impm-team"],
      missions: [
        {
          start: subDays(now, 30),
          end: subDays(now, -30),
          startups: ["impm-startup-c"],
        },
      ],
    },
  ],
};

type Body = { data: { username: string }[]; meta: { total: number } };

describe("api v1 incubator members perimeter", () => {
  const keys: string[] = [];
  let startupA: string;
  let incubatorUuid: string;

  const listMembers = async (token: string, query = "") => {
    const res = await listIncubatorMembers(
      apiRequest(
        token,
        `http://localhost/api/v1/incubators/impm-incub/members?limit=100${query}`,
      ),
      { params: Promise.resolve({ id: "impm-incub" }) },
    );
    expect(res.status).to.equal(200);
    const body = (await res.json()) as Body;
    return {
      usernames: body.data.map((member) => member.username).sort(),
      total: body.meta.total,
    };
  };

  before(async () => {
    await createData(testData);
    startupA = (
      await db
        .selectFrom("startups")
        .select("uuid")
        .where("ghid", "=", "impm-startup-a")
        .executeTakeFirstOrThrow()
    ).uuid;
    incubatorUuid = (
      await db
        .selectFrom("incubators")
        .select("uuid")
        .where("ghid", "=", "impm-incub")
        .executeTakeFirstOrThrow()
    ).uuid;
  });

  after(async () => {
    for (const uuid of keys) await deleteTestApiKey(uuid);
    await deleteData(testData);
  });

  const keyFor = async (
    read: Parameters<typeof createTestApiKey>[0]["read"],
  ) => {
    const key = await createTestApiKey({ scopes: ["members:read"], read });
    keys.push(key.uuid);
    return key;
  };

  /**
   * L'arbitrage : le filtre du chemin ne suffit pas. Une clef startup/A ne doit
   * pas enumerer les membres des autres produits de l'incubateur de A, ni ceux
   * qui n'y sont rattaches que par une equipe.
   */
  it("narrows the incubator members to the member perimeter of the key", async () => {
    const key = await keyFor({ kind: "startup", uuid: startupA });
    const { usernames, total } = await listMembers(key.token);

    expect(usernames).to.deep.equal(["impm-on-a"]);
    expect(
      usernames,
      "fuite : un membre d'un autre produit du meme incubateur est enumere",
    ).to.not.include("impm-on-b");
    expect(
      usernames,
      "fuite : un membre rattache par equipe seulement est enumere",
    ).to.not.include("impm-on-team");
    // total est compte sur la meme base que la page : il doit suivre le
    // perimetre, sinon il divulgue le cardinal reel.
    expect(total).to.equal(1);
  });

  it("still returns every member of the incubator to a global key", async () => {
    const key = await keyFor({ kind: "global" });
    const { usernames, total } = await listMembers(key.token);
    expect(usernames).to.deep.equal(["impm-on-a", "impm-on-b", "impm-on-team"]);
    expect(total).to.equal(3);
  });

  /**
   * Le perimetre s'AJOUTE au filtre du chemin, il ne le remplace pas : une clef
   * incubator/impm-other ne peut pas s'en servir pour lire les membres de
   * impm-incub, elle est arretee avant, en 403.
   */
  it("keeps the path filter : an incubator key sees only its own incubator", async () => {
    const other = (
      await db
        .selectFrom("incubators")
        .select("uuid")
        .where("ghid", "=", "impm-other")
        .executeTakeFirstOrThrow()
    ).uuid;
    const key = await keyFor({ kind: "incubator", uuid: other });
    const res = await listIncubatorMembers(
      apiRequest(
        key.token,
        "http://localhost/api/v1/incubators/impm-incub/members",
      ),
      { params: Promise.resolve({ id: "impm-incub" }) },
    );
    expect(res.status).to.equal(403);
  });

  it("keeps applying the perimeter with ?status=active", async () => {
    const key = await keyFor({ kind: "startup", uuid: startupA });
    const { usernames } = await listMembers(key.token, "&status=active");
    expect(usernames).to.deep.equal(["impm-on-a"]);
  });

  // Le perimetre filtre des LIGNES, jamais des colonnes : la personne visible
  // garde ses equipes et ses missions de l'incubateur du chemin.
  it("does not truncate the row it keeps", async () => {
    const key = await keyFor({ kind: "incubator", uuid: incubatorUuid });
    const res = await listIncubatorMembers(
      apiRequest(
        key.token,
        "http://localhost/api/v1/incubators/impm-incub/members?limit=100",
      ),
      { params: Promise.resolve({ id: "impm-incub" }) },
    );
    expect(res.status).to.equal(200);
    const body = (await res.json()) as {
      data: { username: string; missions: unknown[] }[];
    };
    const onA = body.data.find((member) => member.username === "impm-on-a")!;
    expect(onA, "membre absent").to.exist;
    expect(onA.missions).to.have.length(1);
  });
});
