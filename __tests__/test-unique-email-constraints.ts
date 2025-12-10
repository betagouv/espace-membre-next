import chai from "chai";
import { addDays } from "date-fns";

import utils from "./utils";
import { db } from "@/lib/kysely";

const { expect } = chai;

describe("Test unique email constraints", () => {
  const testUser1 = {
    users: [
      {
        username: "test.user1",
        fullname: "Test User1",
        missions: [
          {
            start: new Date(),
            end: addDays(new Date(), 365),
          },
        ],
      },
    ],
  };

  const testUser2 = {
    users: [
      {
        username: "test.user2",
        fullname: "Test User2",
        missions: [
          {
            start: new Date(),
            end: addDays(new Date(), 365),
          },
        ],
      },
    ],
  };

  afterEach(async () => {
    await utils.deleteData(testUser1);
    await utils.deleteData(testUser2);
  });

  describe("primary_email unique constraint", () => {
    it("should prevent duplicate primary_email values", async () => {
      await utils.createData(testUser1);
      await utils.createData(testUser2);

      const primaryEmail = "duplicate@beta.gouv.fr";

      // Set primary_email for first user
      await db
        .updateTable("users")
        .where("username", "=", "test.user1")
        .set({ primary_email: primaryEmail })
        .execute();

      // Try to set the same primary_email for second user
      try {
        await db
          .updateTable("users")
          .where("username", "=", "test.user2")
          .set({ primary_email: primaryEmail })
          .execute();

        // If we reach here, the constraint didn't work
        expect.fail(
          "Should have thrown an error due to unique constraint",
        );
      } catch (err: any) {
        // Verify that the error is a unique constraint violation
        expect(err.code).to.equal("23505"); // PostgreSQL unique violation error code
        expect(err.constraint).to.include("primary_email");
      }
    });

    it("should allow null primary_email for multiple users", async () => {
      await utils.createData(testUser1);
      await utils.createData(testUser2);

      // Both users should be able to have null primary_email
      await db
        .updateTable("users")
        .where("username", "=", "test.user1")
        .set({ primary_email: null })
        .execute();

      await db
        .updateTable("users")
        .where("username", "=", "test.user2")
        .set({ primary_email: null })
        .execute();

      const user1 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user1")
        .executeTakeFirst();

      const user2 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user2")
        .executeTakeFirst();

      expect(user1?.primary_email).to.be.null;
      expect(user2?.primary_email).to.be.null;
    });

    it("should allow different primary_email values", async () => {
      await utils.createData(testUser1);
      await utils.createData(testUser2);

      await db
        .updateTable("users")
        .where("username", "=", "test.user1")
        .set({ primary_email: "user1@beta.gouv.fr" })
        .execute();

      await db
        .updateTable("users")
        .where("username", "=", "test.user2")
        .set({ primary_email: "user2@beta.gouv.fr" })
        .execute();

      const user1 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user1")
        .executeTakeFirst();

      const user2 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user2")
        .executeTakeFirst();

      expect(user1?.primary_email).to.equal("user1@beta.gouv.fr");
      expect(user2?.primary_email).to.equal("user2@beta.gouv.fr");
    });
  });

  describe("secondary_email unique constraint", () => {
    it("should prevent duplicate secondary_email values", async () => {
      await utils.createData(testUser1);
      await utils.createData(testUser2);

      const secondaryEmail = "duplicate.secondary@example.com";

      // Set secondary_email for first user
      await db
        .updateTable("users")
        .where("username", "=", "test.user1")
        .set({ secondary_email: secondaryEmail })
        .execute();

      // Try to set the same secondary_email for second user
      try {
        await db
          .updateTable("users")
          .where("username", "=", "test.user2")
          .set({ secondary_email: secondaryEmail })
          .execute();

        // If we reach here, the constraint didn't work
        expect.fail(
          "Should have thrown an error due to unique constraint",
        );
      } catch (err: any) {
        // Verify that the error is a unique constraint violation
        expect(err.code).to.equal("23505"); // PostgreSQL unique violation error code
        expect(err.constraint).to.include("secondary_email");
      }
    });

    it("should allow null secondary_email for multiple users", async () => {
      await utils.createData(testUser1);
      await utils.createData(testUser2);

      // Both users should be able to have null secondary_email
      await db
        .updateTable("users")
        .where("username", "=", "test.user1")
        .set({ secondary_email: null })
        .execute();

      await db
        .updateTable("users")
        .where("username", "=", "test.user2")
        .set({ secondary_email: null })
        .execute();

      const user1 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user1")
        .executeTakeFirst();

      const user2 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user2")
        .executeTakeFirst();

      expect(user1?.secondary_email).to.be.null;
      expect(user2?.secondary_email).to.be.null;
    });

    it("should allow different secondary_email values", async () => {
      await utils.createData(testUser1);
      await utils.createData(testUser2);

      await db
        .updateTable("users")
        .where("username", "=", "test.user1")
        .set({ secondary_email: "user1.secondary@example.com" })
        .execute();

      await db
        .updateTable("users")
        .where("username", "=", "test.user2")
        .set({ secondary_email: "user2.secondary@example.com" })
        .execute();

      const user1 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user1")
        .executeTakeFirst();

      const user2 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user2")
        .executeTakeFirst();

      expect(user1?.secondary_email).to.equal(
        "user1.secondary@example.com",
      );
      expect(user2?.secondary_email).to.equal(
        "user2.secondary@example.com",
      );
    });
  });

  describe("cross-constraint behavior", () => {
    it("should allow same email as primary for one user and secondary for another", async () => {
      await utils.createData(testUser1);
      await utils.createData(testUser2);

      const email = "shared@example.com";

      await db
        .updateTable("users")
        .where("username", "=", "test.user1")
        .set({ primary_email: email })
        .execute();

      await db
        .updateTable("users")
        .where("username", "=", "test.user2")
        .set({ secondary_email: email })
        .execute();

      const user1 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user1")
        .executeTakeFirst();

      const user2 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "test.user2")
        .executeTakeFirst();

      expect(user1?.primary_email).to.equal(email);
      expect(user2?.secondary_email).to.equal(email);
    });
  });
});
