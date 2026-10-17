import { expect } from "chai";
import { subDays } from "date-fns";

import { authenticateApiKey } from "@/lib/api/withApiV1";
import { db } from "@/lib/kysely";

import { apiRequest, createTestApiKey, deleteTestApiKey } from "./utils/apiKey";
import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const testData: FakeDataInterface = {
  incubators: [{ ghid: "auth-incub", title: "Auth Incubateur" }],
  startups: [],
  users: [],
};

const authenticate = (token: string) =>
  authenticateApiKey(apiRequest(token, "http://localhost/api/v1/startups"));

describe("api key authentication", () => {
  const created: string[] = [];

  const makeKey = async () => {
    const key = await createTestApiKey({ scopes: ["startups:read"] });
    created.push(key.uuid);
    return key;
  };

  before(async () => {
    await createData(testData);
  });

  after(async () => {
    for (const uuid of created) await deleteTestApiKey(uuid);
    await deleteData(testData);
    delete process.env.API_KEYS_AUTH_DISABLED;
    delete process.env.API_KEYS_BLOCKED_USERS;
  });

  it("accepts a live key", async () => {
    const key = await makeKey();
    const auth = await authenticate(key.token);
    expect(auth.ok).to.be.true;
    expect(auth.ok && auth.key.scopes).to.deep.equal(["startups:read"]);
    expect(auth.ok && auth.key.readLabel).to.equal("global");
  });

  it("answers 401 invalid_request without a token", async () => {
    const auth = await authenticateApiKey(
      new Request("http://localhost/api/v1/startups") as never,
    );
    expect(auth.ok).to.be.false;
    if (!auth.ok) {
      expect(auth.response.status).to.equal(401);
      expect(auth.response.headers.get("www-authenticate")).to.include(
        "invalid_request",
      );
    }
  });

  it("answers 401 invalid_token on an unknown token", async () => {
    const auth = await authenticate(`em1_${"a".repeat(40)}`);
    expect(auth.ok).to.be.false;
    if (!auth.ok) expect(auth.response.status).to.equal(401);
  });

  /**
   * L'etat de la clef est relu a CHAQUE requete, jamais mis en cache : deux
   * appels encadrant une revocation doivent donner deux resultats differents.
   */
  it("re-reads the key state on every request", async () => {
    const key = await makeKey();
    expect((await authenticate(key.token)).ok).to.be.true;

    await db
      .updateTable("api_keys")
      .set({ revoked_at: new Date(), revoked_reason: "test" })
      .where("uuid", "=", key.uuid)
      .execute();

    const auth = await authenticate(key.token);
    expect(auth.ok, "la revocation n'a pas pris effet").to.be.false;
    if (!auth.ok) expect(auth.response.status).to.equal(401);
  });

  it("refuses an expired key", async () => {
    const key = await makeKey();
    await db
      .updateTable("api_keys")
      .set({ expires_at: subDays(new Date(), 1) })
      .where("uuid", "=", key.uuid)
      .execute();
    expect((await authenticate(key.token)).ok).to.be.false;
  });

  // Coupe-circuit d'incident : relu dans process.env a chaque appel, au tout
  // premier etage, avant tout acces base.
  it("answers 503 when API_KEYS_AUTH_DISABLED is armed", async () => {
    const key = await makeKey();
    process.env.API_KEYS_AUTH_DISABLED = "true";
    const auth = await authenticate(key.token);
    delete process.env.API_KEYS_AUTH_DISABLED;

    expect(auth.ok).to.be.false;
    if (!auth.ok) {
      expect(auth.response.status).to.equal(503);
      expect(auth.response.headers.get("retry-after")).to.equal("3600");
    }
    expect((await authenticate(key.token)).ok, "coupe-circuit collant").to.be
      .true;
  });

  /**
   * Le cache d'expiration du porteur ne porte QUE sur le calcul d'expiration :
   * il ne doit jamais masquer une revocation, relue en base a chaque appel.
   */
  it("never lets the owner expiration cache mask a revocation", async () => {
    const key = await makeKey();
    expect((await authenticate(key.token)).ok).to.be.true;
    await db
      .updateTable("api_keys")
      .set({ revoked_at: new Date(), revoked_reason: "test cache" })
      .where("uuid", "=", key.uuid)
      .execute();
    for (let i = 0; i < 3; i++) {
      expect((await authenticate(key.token)).ok).to.be.false;
    }
  });

  it("refuses a key whose perimeter target has disappeared", async () => {
    const incubator = await db
      .insertInto("incubators")
      .values({ title: "A supprimer", ghid: "auth-incub-doomed" })
      .returning("uuid")
      .executeTakeFirstOrThrow();

    const key = await createTestApiKey({
      scopes: ["startups:read"],
      read: { kind: "incubator", uuid: incubator.uuid },
    });
    created.push(key.uuid);
    expect((await authenticate(key.token)).ok).to.be.true;

    // Aucune clef etrangere sur les perimetres : la cible peut disparaitre.
    await db
      .deleteFrom("incubators")
      .where("uuid", "=", incubator.uuid)
      .execute();

    const auth = await authenticate(key.token);
    expect(auth.ok, "clef au perimetre orphelin acceptee").to.be.false;
    if (!auth.ok) {
      expect(auth.response.status).to.equal(401);
      const body = await auth.response.json();
      expect(body.detail).to.include("perimetre");
    }
  });

  it("touches last_used_at on an accepted key", async () => {
    const key = await makeKey();
    await authenticate(key.token);
    const row = await db
      .selectFrom("api_keys")
      .select("last_used_at")
      .where("uuid", "=", key.uuid)
      .executeTakeFirstOrThrow();
    expect(row.last_used_at, "last_used_at non renseigne").to.not.be.null;
  });
});
