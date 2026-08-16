import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import { GET as listStartups } from "@/app/api/v1/startups/route";
import { db } from "@/lib/kysely";

import { apiRequest, createTestApiKey, deleteTestApiKey } from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();

/**
 * L'etage « clef personnelle » de authenticateApiKey (withApiV1.ts) n'etait
 * atteint par aucun test : le fabricant figeait kind sur "service". On pouvait
 * donc supprimer le refus du porteur bloque et celui du porteur expire sans
 * qu'une seule assertion ne bouge, alors que API_KEYS_BLOCKED_USERS est le seul
 * levier d'incident immediat pour couper une clef sans attendre le job.
 */
const testData: FakeDataInterface = {
  incubators: [{ ghid: "pk-incub", title: "PK Incubateur" }],
  startups: [{ ghid: "pk-startup", name: "PK Produit", incubator: "pk-incub" }],
  users: [
    {
      username: "pk-vivant",
      missions: [{ start: subDays(now, 30), end: addDays(now, 180) }],
    },
    {
      username: "pk-parti",
      missions: [{ start: subDays(now, 400), end: subDays(now, 100) }],
    },
  ],
};

describe("api key personal owner", () => {
  const keys: string[] = [];
  const uuidOf = async (username: string) =>
    (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", username)
        .executeTakeFirstOrThrow()
    ).uuid;

  const personalKeyFor = async (username: string) => {
    const key = await createTestApiKey({
      scopes: ["startups:read"],
      kind: "personal",
      ownerUserId: await uuidOf(username),
    });
    keys.push(key.uuid);
    return key;
  };

  const call = (token: string) =>
    listStartups(apiRequest(token, "http://localhost/api/v1/startups"), {
      params: Promise.resolve({}),
    });

  before(async () => {
    await createData(testData);
  });

  after(async () => {
    for (const uuid of keys) await deleteTestApiKey(uuid);
    delete process.env.API_KEYS_BLOCKED_USERS;
    await deleteData(testData);
  });

  it("lets a personal key of a living owner through", async () => {
    const key = await personalKeyFor("pk-vivant");
    expect((await call(key.token)).status).to.equal(200);
  });

  /**
   * La liste est relue a CHAQUE requete : un blocage prend effet immediatement,
   * sans attendre le balayage quotidien.
   */
  it("refuses a personal key whose owner is blocked, and takes effect at once", async () => {
    const key = await personalKeyFor("pk-vivant");
    expect((await call(key.token)).status, "avant blocage").to.equal(200);

    process.env.API_KEYS_BLOCKED_USERS = "pk-vivant";
    const res = await call(key.token);
    expect(res.status, "porteur bloque : la clef passe encore").to.equal(401);
    const body = await res.json();
    expect(body.detail).to.include("bloque");

    delete process.env.API_KEYS_BLOCKED_USERS;
    expect((await call(key.token)).status, "apres deblocage").to.equal(200);
  });

  it("refuses a personal key whose owner has expired", async () => {
    const key = await personalKeyFor("pk-parti");
    const res = await call(key.token);
    expect(res.status, "porteur expire : la clef passe encore").to.equal(401);
    expect((await res.json()).detail).to.include("expire");
  });

  /**
   * Une clef d'application n'a pas de porteur humain : ni le blocage ni
   * l'expiration ne la concernent, et le code ne doit pas essayer de les
   * evaluer sur un owner_user_id nul.
   */
  it("never applies owner rules to a service key", async () => {
    const key = await createTestApiKey({ scopes: ["startups:read"] });
    keys.push(key.uuid);
    process.env.API_KEYS_BLOCKED_USERS = "pk-vivant,pk-parti";
    expect((await call(key.token)).status).to.equal(200);
    delete process.env.API_KEYS_BLOCKED_USERS;
  });

  // Une clef refusee ne doit pas mettre a jour son last_used_at : le rejet
  // tombe AVANT touchApiKey, ce qui garde le compteur d'inactivite honnete.
  it("does not touch last_used_at when the key is refused", async () => {
    const key = await personalKeyFor("pk-parti");
    await call(key.token);
    const row = await db
      .selectFrom("api_keys")
      .select("last_used_at")
      .where("uuid", "=", key.uuid)
      .executeTakeFirstOrThrow();
    expect(row.last_used_at, "une clef refusee a marque son usage").to.be.null;
  });
});
