import { expect } from "chai";

import { getUserChecklists } from "./getUserChecklists";
import { db } from "@/lib/kysely";
import { Domaine } from "@/models/member";
import { createData, deleteData } from "__tests__/utils/fakeData";
import { membreActif, testUsers } from "__tests__/utils/users-data";

describe("getUserChecklists", () => {
  let userUuid: string;

  beforeEach(async () => {
    await createData(testUsers);
    userUuid = (
      await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", membreActif.username)
        .executeTakeFirstOrThrow()
    ).uuid;
  });

  afterEach(async () => {
    await db.deleteFrom("user_events").execute();
    await deleteData(testUsers);
  });

  const onboardingProgress = async () =>
    (await getUserChecklists(userUuid, Domaine.ANIMATION, new Date()))
      .onboarding?.progress;

  it("should count a not concerned item like a done one in the progress", async () => {
    const before = await onboardingProgress();

    await db
      .insertInto("user_events")
      .values({
        user_id: userUuid,
        field_id: "onboarding-forum-beta",
        date: new Date(),
        not_concerned_reason: "ancien-membre",
      })
      .execute();
    const notConcerned = await onboardingProgress();

    await db
      .updateTable("user_events")
      .set({ not_concerned_reason: null })
      .where("user_id", "=", userUuid)
      .execute();
    const done = await onboardingProgress();

    expect(notConcerned).to.be.greaterThan(before!);
    expect(notConcerned).to.equal(done);
  });

  it("should give back the reason and the comment with the user events", async () => {
    await db
      .insertInto("user_events")
      .values({
        user_id: userUuid,
        field_id: "onboarding-forum-beta",
        date: new Date(),
        not_concerned_reason: "autre",
        not_concerned_comment: "Congé parental",
      })
      .execute();

    const { onboarding } = await getUserChecklists(
      userUuid,
      Domaine.ANIMATION,
      new Date(),
    );
    const event = onboarding?.userEvents.find(
      (e) => e.field_id === "onboarding-forum-beta",
    );
    expect(event?.not_concerned_reason).to.equal("autre");
    expect(event?.not_concerned_comment).to.equal("Congé parental");
  });
});
