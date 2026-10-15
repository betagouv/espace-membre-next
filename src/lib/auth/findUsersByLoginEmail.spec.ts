import { expect } from "chai";

import {
  findUsersByLoginEmail,
  normalizeLoginEmail,
} from "@/lib/auth/findUsersByLoginEmail";
import customPostgresAdapter from "@/lib/pgAdpter";
import { db } from "@/lib/kysely";
import { createData, deleteData } from "__tests__/utils/fakeData";

const userA = {
  username: "membre.login.a",
  primary_email: "membre.login.a@beta.gouv.fr",
  missions: [],
};
const userB = {
  username: "membre.login.b",
  primary_email: "membre.login.b@beta.gouv.fr",
  missions: [],
};

const getUuid = async (username: string) =>
  (
    await db
      .selectFrom("users")
      .select("uuid")
      .where("username", "=", username)
      .executeTakeFirstOrThrow()
  ).uuid;

describe("normalizeLoginEmail", () => {
  it("should trim and lowercase a valid email", () => {
    expect(normalizeLoginEmail("  Prenom.Nom@Beta.Gouv.fr ")).to.equal(
      "prenom.nom@beta.gouv.fr",
    );
  });

  it("should reject empty, missing or invalid emails", () => {
    expect(normalizeLoginEmail("")).to.be.null;
    expect(normalizeLoginEmail("   ")).to.be.null;
    expect(normalizeLoginEmail(undefined)).to.be.null;
    expect(normalizeLoginEmail(null)).to.be.null;
    expect(normalizeLoginEmail("not-an-email")).to.be.null;
    expect(normalizeLoginEmail("%")).to.be.null;
  });
});

describe("findUsersByLoginEmail", () => {
  let uuidA: string;
  let uuidB: string;

  beforeEach(async () => {
    await createData({ users: [userA, userB] });
    uuidA = await getUuid(userA.username);
    uuidB = await getUuid(userB.username);
  });

  afterEach(async () => {
    await db
      .deleteFrom("dinum_emails")
      .where("user_id", "in", [uuidA, uuidB])
      .execute();
    await deleteData({ users: [userA, userB] });
  });

  it("should find a user by primary_email regardless of case", async () => {
    const users = await findUsersByLoginEmail("MEMBRE.LOGIN.A@beta.gouv.fr");
    expect(users.map((u) => u.username)).to.deep.equal([userA.username]);
  });

  it("should find a user by secondary_email", async () => {
    await db
      .updateTable("users")
      .set({ secondary_email: "perso.a@example.com" })
      .where("uuid", "=", uuidA)
      .execute();
    const users = await findUsersByLoginEmail("Perso.A@example.com");
    expect(users.map((u) => u.username)).to.deep.equal([userA.username]);
  });

  it("should find a user through a linked dinum_emails row", async () => {
    await db
      .insertInto("dinum_emails")
      .values({ email: "prenom.nom@dinum.gouv.fr", user_id: uuidA })
      .execute();
    const users = await findUsersByLoginEmail("prenom.nom@DINUM.gouv.fr");
    expect(users.map((u) => u.username)).to.deep.equal([userA.username]);
  });

  it("should not match any user when the email is empty, even if some rows store ''", async () => {
    await db
      .updateTable("users")
      .set({ secondary_email: "" })
      .where("uuid", "=", uuidA)
      .execute();
    expect(await findUsersByLoginEmail("")).to.deep.equal([]);
    expect(await findUsersByLoginEmail(undefined)).to.deep.equal([]);
  });

  it("should not treat _ or % as wildcards", async () => {
    // "membre_login_a@..." would match "membre.login.a@..." with ILIKE
    expect(
      await findUsersByLoginEmail("membre_login_a@beta.gouv.fr"),
    ).to.deep.equal([]);
    expect(await findUsersByLoginEmail("membre.login.%@beta.gouv.fr")).to.deep
      .equal([]);
  });

  it("should return several users when the email is ambiguous", async () => {
    await db
      .updateTable("users")
      .set({ secondary_email: userA.primary_email })
      .where("uuid", "=", uuidB)
      .execute();
    const users = await findUsersByLoginEmail(userA.primary_email);
    expect(users.map((u) => u.username).sort()).to.deep.equal(
      [userA.username, userB.username].sort(),
    );
  });

  it("adapter getUserByEmail should refuse an ambiguous email", async () => {
    await db
      .updateTable("users")
      .set({ secondary_email: userA.primary_email })
      .where("uuid", "=", uuidB)
      .execute();
    const adapter = customPostgresAdapter();
    expect(await adapter.getUserByEmail!(userA.primary_email)).to.be.null;
  });
});
