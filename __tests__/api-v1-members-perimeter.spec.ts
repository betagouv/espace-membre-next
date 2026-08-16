import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import { GET as getMember } from "@/app/api/v1/members/[id]/route";
import { GET as listMembers } from "@/app/api/v1/members/route";
import { db } from "@/lib/kysely";

import { apiRequest, createTestApiKey, deleteTestApiKey } from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();
const live = { start: subDays(now, 30), end: addDays(now, 180) };

/**
 * Le perimetre membre de /api/v1/members n'etait exerce par rien : toutes les
 * clefs des tests existants sont globales. On pouvait remplacer ctx.key.read
 * par { kind: "global" }, ou retirer applyMemberPerimeter, et voir l'annuaire
 * entier partir avec les adresses de chacun, sans qu'une assertion ne bouge.
 */
const testData: FakeDataInterface = {
  incubators: [
    { ghid: "mp-incub", title: "MP Incubateur" },
    { ghid: "mp-other", title: "MP Autre" },
  ],
  startups: [
    { ghid: "mp-startup-a", name: "MP Produit A", incubator: "mp-incub" },
    { ghid: "mp-startup-b", name: "MP Produit B", incubator: "mp-incub" },
    { ghid: "mp-startup-c", name: "MP Produit C", incubator: "mp-other" },
  ],
  teams: [{ ghid: "mp-team", name: "MP Equipe", incubator: "mp-incub" }],
  users: [
    { username: "mp-on-a", missions: [{ ...live, startups: ["mp-startup-a"] }] },
    { username: "mp-on-b", missions: [{ ...live, startups: ["mp-startup-b"] }] },
    {
      username: "mp-on-team",
      teams: ["mp-team"],
      missions: [{ ...live, startups: ["mp-startup-c"] }],
    },
  ],
};

describe("api v1 members perimeter", () => {
  const keys: string[] = [];
  let startupA: string;
  let incubator: string;

  const keyFor = async (read: Parameters<typeof createTestApiKey>[0]["read"]) => {
    const key = await createTestApiKey({ scopes: ["members:read"], read });
    keys.push(key.uuid);
    return key;
  };

  const list = async (token: string) => {
    const res = await listMembers(
      apiRequest(token, "http://localhost/api/v1/members?limit=100"),
      { params: Promise.resolve({}) },
    );
    expect(res.status).to.equal(200);
    const body = (await res.json()) as {
      data: { username: string }[];
      meta: { total: number };
    };
    return {
      usernames: body.data
        .map((member) => member.username)
        .filter((username) => username.startsWith("mp-"))
        .sort(),
      total: body.meta.total,
    };
  };

  before(async () => {
    await createData(testData);
    startupA = (
      await db
        .selectFrom("startups")
        .select("uuid")
        .where("ghid", "=", "mp-startup-a")
        .executeTakeFirstOrThrow()
    ).uuid;
    incubator = (
      await db
        .selectFrom("incubators")
        .select("uuid")
        .where("ghid", "=", "mp-incub")
        .executeTakeFirstOrThrow()
    ).uuid;
  });

  after(async () => {
    for (const uuid of keys) await deleteTestApiKey(uuid);
    await deleteData(testData);
  });

  it("narrows the collection to the members of a startup perimeter", async () => {
    const key = await keyFor({ kind: "startup", uuid: startupA });
    const { usernames } = await list(key.token);
    expect(usernames).to.deep.equal(["mp-on-a"]);
    expect(usernames, "fuite : un membre hors perimetre est enumere").to.not
      .include("mp-on-b");
  });

  /**
   * total est compte sur la meme base que la page : s'il ne suivait pas, il
   * divulguerait le cardinal reel de l'annuaire.
   */
  it("counts the total on the narrowed set, not on the whole directory", async () => {
    const scoped = await keyFor({ kind: "startup", uuid: startupA });
    const global = await keyFor({ kind: "global" });
    const narrowed = await list(scoped.token);
    const everything = await list(global.token);

    expect(narrowed.total).to.equal(1);
    expect(
      narrowed.total,
      "total non filtre : il revele le cardinal de l'annuaire",
    ).to.be.lessThan(everything.total);
  });

  // Un perimetre incubateur voit les deux chemins de rattachement, produit et
  // equipe, mais rien de l'autre incubateur.
  it("covers both attachment paths on an incubator perimeter", async () => {
    const key = await keyFor({ kind: "incubator", uuid: incubator });
    const { usernames } = await list(key.token);
    expect(usernames).to.deep.equal(["mp-on-a", "mp-on-b", "mp-on-team"]);
  });

  it("answers 403 on a member outside the perimeter", async () => {
    const key = await keyFor({ kind: "startup", uuid: startupA });
    const res = await getMember(
      apiRequest(key.token, "http://localhost/api/v1/members/mp-on-b"),
      { params: Promise.resolve({ id: "mp-on-b" }) },
    );
    expect(res.status, "fiche detaillee lisible hors perimetre").to.equal(403);
  });

  it("still answers 200 on a member inside the perimeter", async () => {
    const key = await keyFor({ kind: "startup", uuid: startupA });
    const res = await getMember(
      apiRequest(key.token, "http://localhost/api/v1/members/mp-on-a"),
      { params: Promise.resolve({ id: "mp-on-a" }) },
    );
    expect(res.status).to.equal(200);
  });
});
