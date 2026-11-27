import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import { generateApiKeyToken } from "@/lib/api-keys/token";
import { db } from "@/lib/kysely";
import { mergeMembers } from "@/lib/members/mergeMembers";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { createData, deleteData } from "__tests__/utils/fakeData";

const testData = {
  incubators: [{ ghid: "merge-incubator" }],
  teams: [
    { ghid: "merge-team-shared", incubator: "merge-incubator" },
    { ghid: "merge-team-old", incubator: "merge-incubator" },
  ],
  startups: [{ ghid: "merge-startup" }],
  users: [
    {
      username: "merge.keep",
      missions: [
        { start: subDays(new Date(), 30), end: addDays(new Date(), 300) },
      ],
      teams: ["merge-team-shared"],
    },
    {
      username: "merge.old",
      missions: [
        {
          start: subDays(new Date(), 900),
          end: subDays(new Date(), 400),
          startups: ["merge-startup"],
        },
      ],
      teams: ["merge-team-shared", "merge-team-old"],
    },
  ],
};

const uuidOf = async (username: string) =>
  (
    await db
      .selectFrom("users")
      .select("uuid")
      .where("username", "=", username)
      .executeTakeFirstOrThrow()
  ).uuid;

describe("mergeMembers", () => {
  let keepUuid: string;
  let oldUuid: string;
  let formationId: string;

  beforeEach(async () => {
    await createData(testData);
    keepUuid = await uuidOf("merge.keep");
    oldUuid = await uuidOf("merge.old");

    await db
      .insertInto("user_events")
      .values([
        { user_id: keepUuid, field_id: "shared-step", date: new Date() },
        { user_id: oldUuid, field_id: "shared-step", date: new Date() },
        { user_id: oldUuid, field_id: "old-step", date: new Date() },
      ])
      .execute();
    await db
      .insertInto("dinum_emails")
      .values({ email: "merge.old@test.gouv.fr", user_id: oldUuid })
      .execute();
    await db
      .insertInto("matrix_accounts")
      .values({ user_id: oldUuid, matrix_id: "@merge.old:tchap.gouv.fr" })
      .execute();
    const { tokenHash, tokenPrefix } = generateApiKeyToken();
    await db
      .insertInto("api_keys")
      .values({
        kind: "personal",
        name: "merge",
        token_hash: tokenHash,
        token_prefix: tokenPrefix,
        scopes: ["startups:read"],
        read_perimeter_kind: "global",
        owner_user_id: oldUuid,
        created_by_user_id: oldUuid,
      })
      .execute();
    await db
      .updateTable("startups")
      .set({ contact_incubator: oldUuid })
      .where("ghid", "=", "merge-startup")
      .execute();
    formationId = (
      await db
        .insertInto("formations")
        .values({ name: "merge-formation" })
        .returning("id")
        .executeTakeFirstOrThrow()
    ).id;
    await db
      .insertInto("users_formations")
      .values({ username: "merge.old", formation_id: formationId })
      .execute();
    await db
      .insertInto("events")
      .values({
        action_code: EventCode.MEMBER_BASE_INFO_UPDATED,
        created_by_username: "merge.old",
        action_on_username: "merge.old",
      })
      .execute();
  });

  afterEach(async () => {
    const usernames = ["merge.keep", "merge.old"];
    await db
      .deleteFrom("users_formations")
      .where("username", "in", usernames)
      .execute();
    await db
      .deleteFrom("formations")
      .where("name", "=", "merge-formation")
      .execute();
    await db.deleteFrom("api_keys").where("name", "=", "merge").execute();
    await db
      .deleteFrom("dinum_emails")
      .where("email", "=", "merge.old@test.gouv.fr")
      .execute();
    await db
      .deleteFrom("events")
      .where((eb) =>
        eb.or([
          eb("action_on_username", "in", usernames),
          eb("created_by_username", "in", usernames),
        ]),
      )
      .execute();
    await db
      .updateTable("startups")
      .set({ contact_incubator: null })
      .where("ghid", "=", "merge-startup")
      .execute();
    await deleteData(testData);
  });

  it("moves everything to the kept member and deletes the other one", async () => {
    const { counts } = await mergeMembers({
      keepUuid,
      absorbedUuid: oldUuid,
      adminUsername: "an.admin",
    });

    expect(counts).to.include({
      missions: 1,
      teams: 1,
      userEvents: 1,
      dinumEmails: 1,
      matrixAccount: 1,
      apiKeys: 2,
      startupContacts: 1,
      formations: 1,
      events: 2,
    });

    expect(
      await db
        .selectFrom("users")
        .select("uuid")
        .where("uuid", "=", oldUuid)
        .executeTakeFirst(),
    ).to.be.undefined;

    const missions = await db
      .selectFrom("missions")
      .innerJoin(
        "missions_startups",
        "missions_startups.mission_id",
        "missions.uuid",
      )
      .select("missions.uuid")
      .where("missions.user_id", "=", keepUuid)
      .execute();
    expect(missions).to.have.length(1);

    const teams = await db
      .selectFrom("users_teams")
      .select("team_id")
      .where("user_id", "=", keepUuid)
      .execute();
    expect(teams).to.have.length(2);

    const steps = await db
      .selectFrom("user_events")
      .select("field_id")
      .where("user_id", "=", keepUuid)
      .orderBy("field_id")
      .execute();
    expect(steps.map((s) => s.field_id)).to.deep.equal([
      "old-step",
      "shared-step",
    ]);

    const matrix = await db
      .selectFrom("matrix_accounts")
      .select("matrix_id")
      .where("user_id", "=", keepUuid)
      .executeTakeFirstOrThrow();
    expect(matrix.matrix_id).to.equal("@merge.old:tchap.gouv.fr");

    const key = await db
      .selectFrom("api_keys")
      .select(["owner_user_id", "created_by_user_id"])
      .where("name", "=", "merge")
      .executeTakeFirstOrThrow();
    expect(key).to.deep.equal({
      owner_user_id: keepUuid,
      created_by_user_id: keepUuid,
    });

    const formation = await db
      .selectFrom("users_formations")
      .select("username")
      .where("formation_id", "=", formationId)
      .executeTakeFirstOrThrow();
    expect(formation.username).to.equal("merge.keep");

    const mergeEvent = await db
      .selectFrom("events")
      .select(["created_by_username", "action_metadata"])
      .where("action_code", "=", EventCode.MEMBER_MERGED)
      .where("action_on_username", "=", "merge.keep")
      .executeTakeFirstOrThrow();
    expect(mergeEvent.created_by_username).to.equal("an.admin");
    expect(mergeEvent.action_metadata).to.contain("merge.old");
  });

  it("keeps the Tchap account of the kept member when both have one", async () => {
    await db
      .insertInto("matrix_accounts")
      .values({ user_id: keepUuid, matrix_id: "@merge.keep:tchap.gouv.fr" })
      .execute();

    const { counts } = await mergeMembers({
      keepUuid,
      absorbedUuid: oldUuid,
      adminUsername: "an.admin",
    });

    expect(counts.matrixAccount).to.equal(0);
    const accounts = await db
      .selectFrom("matrix_accounts")
      .select("matrix_id")
      .where("user_id", "in", [keepUuid, oldUuid])
      .execute();
    expect(accounts.map((a) => a.matrix_id)).to.deep.equal([
      "@merge.keep:tchap.gouv.fr",
    ]);
  });

  it("previews the merge without changing anything", async () => {
    const { counts, absorbed } = await mergeMembers({
      keepUuid,
      absorbedUuid: oldUuid,
      adminUsername: "an.admin",
      dryRun: true,
    });

    expect(absorbed.username).to.equal("merge.old");
    expect(counts.missions).to.equal(1);
    expect(await uuidOf("merge.old")).to.equal(oldUuid);
    const missions = await db
      .selectFrom("missions")
      .select("uuid")
      .where("user_id", "=", oldUuid)
      .execute();
    expect(missions).to.have.length(1);
    const mergeEvents = await db
      .selectFrom("events")
      .select("id")
      .where("action_code", "=", EventCode.MEMBER_MERGED)
      .where("action_on_username", "=", "merge.keep")
      .execute();
    expect(mergeEvents).to.have.length(0);
  });

  it("refuses to merge a member into itself", async () => {
    const error = await mergeMembers({
      keepUuid,
      absorbedUuid: keepUuid,
      adminUsername: "an.admin",
    }).catch((e) => e);
    expect(error).to.be.instanceOf(Error);
    expect(await uuidOf("merge.keep")).to.equal(keepUuid);
  });

  it("refuses to let an admin absorb their own member page", async () => {
    const error = await mergeMembers({
      keepUuid,
      absorbedUuid: oldUuid,
      adminUsername: "merge.old",
    }).catch((e) => e);
    expect(error).to.be.instanceOf(Error);
    expect(await uuidOf("merge.old")).to.equal(oldUuid);
  });
});
