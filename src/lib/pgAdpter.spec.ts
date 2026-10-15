import { expect } from "chai";

import customPostgresAdapter from "@/lib/pgAdpter";
import { db } from "@/lib/kysely";
import { createData, deleteData } from "__tests__/utils/fakeData";

const testUser = {
  username: "membre.actif.pgadapter",
  primary_email: "membre.actif.pgadapter@beta.gouv.fr",
  missions: [],
};

describe("customPostgresAdapter getUserByEmail", () => {
  const adapter = customPostgresAdapter();
  let userUuid: string;

  beforeEach(async () => {
    await createData({ users: [testUser] });
    const user = await db
      .selectFrom("users")
      .select(["uuid"])
      .where("username", "=", testUser.username)
      .executeTakeFirstOrThrow();
    userUuid = user.uuid;
  });

  afterEach(async () => {
    await db
      .deleteFrom("dinum_emails")
      .where("user_id", "=", userUuid)
      .execute();
    await deleteData({ users: [testUser] });
  });

  it("should find a user by primary_email regardless of case", async () => {
    const foundUser = await adapter.getUserByEmail!(
      testUser.primary_email.toUpperCase(),
    );

    expect(foundUser).to.not.be.null;
    expect(foundUser!.id).to.equal(testUser.username);
  });

  it("should find a user through the dinum_emails table when the email is not the primary/secondary email", async () => {
    await db
      .insertInto("dinum_emails")
      .values({
        email: "membre.actif.pgadapter@dinum.gouv.fr",
        user_id: userUuid,
      })
      .execute();

    const foundUser = await adapter.getUserByEmail!(
      "MEMBRE.ACTIF.PGADAPTER@dinum.gouv.fr",
    );

    expect(foundUser).to.not.be.null;
    expect(foundUser!.id).to.equal(testUser.username);
  });

  it("should return null when no user matches the email", async () => {
    const foundUser = await adapter.getUserByEmail!(
      "unknown.member@beta.gouv.fr",
    );

    expect(foundUser).to.be.null;
  });
});
