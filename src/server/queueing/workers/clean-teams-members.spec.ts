import { addDays, subDays } from "date-fns";
import { Selectable } from "kysely";

import { Users } from "@/@types/db";
import { db } from "@/lib/kysely";
import { Domaine } from "@/models/member";
import utils from "__tests__/utils";

import { cleanTeamsMembers } from "./clean-teams-members";

const testUsers = [
  {
    id: "clean-teams.active",
    fullname: "Active Member",
    domaine: Domaine.ANIMATION,
    missions: [{ start: "2020-01-01", end: "2040-01-01" }],
  },
  {
    id: "clean-teams.expired",
    fullname: "Expired Member",
    domaine: Domaine.ANIMATION,
    missions: [{ start: "2020-01-01", end: "2021-01-01" }],
  },
];

describe("cleanTeamsMembers()", () => {
  let activeUser: Selectable<Users>;
  let expiredUser: Selectable<Users>;
  let team: Selectable<{ uuid: string; name: string; incubator_id: string | null }>;
  let incubator: Selectable<{ uuid: string; title: string }>;

  beforeEach(async () => {
    await utils.createUsers(testUsers);

    incubator = await db
      .insertInto("incubators")
      .values({ title: "Test Incubator" })
      .returningAll()
      .executeTakeFirstOrThrow();

    team = await db
      .insertInto("teams")
      .values({ name: "Test Team", incubator_id: incubator.uuid })
      .returningAll()
      .executeTakeFirstOrThrow();

    activeUser = await db
      .selectFrom("users")
      .where("username", "=", "clean-teams.active")
      .selectAll()
      .executeTakeFirstOrThrow();

    expiredUser = await db
      .selectFrom("users")
      .where("username", "=", "clean-teams.expired")
      .selectAll()
      .executeTakeFirstOrThrow();
  });

  afterEach(async () => {
    await db.deleteFrom("teams").where("uuid", "=", team.uuid).execute();
    await db
      .deleteFrom("incubators")
      .where("uuid", "=", incubator.uuid)
      .execute();
    await utils.deleteUsers(testUsers);
  });

  it("should remove expired users from teams", async () => {
    await db
      .insertInto("users_teams")
      .values({ user_id: expiredUser.uuid, team_id: team.uuid })
      .execute();

    await cleanTeamsMembers();

    const remaining = await db
      .selectFrom("users_teams")
      .where("user_id", "=", expiredUser.uuid)
      .where("team_id", "=", team.uuid)
      .selectAll()
      .execute();

    remaining.length.should.equal(0);
  });

  it("should not remove active users from teams", async () => {
    await db
      .insertInto("users_teams")
      .values({ user_id: activeUser.uuid, team_id: team.uuid })
      .execute();

    await cleanTeamsMembers();

    const remaining = await db
      .selectFrom("users_teams")
      .where("user_id", "=", activeUser.uuid)
      .where("team_id", "=", team.uuid)
      .selectAll()
      .execute();

    remaining.length.should.equal(1);

    await db
      .deleteFrom("users_teams")
      .where("user_id", "=", activeUser.uuid)
      .where("team_id", "=", team.uuid)
      .execute();
  });

  it("should remove only expired users when both active and expired are in a team", async () => {
    await db
      .insertInto("users_teams")
      .values([
        { user_id: activeUser.uuid, team_id: team.uuid },
        { user_id: expiredUser.uuid, team_id: team.uuid },
      ])
      .execute();

    await cleanTeamsMembers();

    const afterClean = await db
      .selectFrom("users_teams")
      .where("team_id", "=", team.uuid)
      .selectAll()
      .execute();

    const userIds = afterClean.map((r) => r.user_id);
    userIds.should.include(activeUser.uuid);
    userIds.should.not.include(expiredUser.uuid);

    await db
      .deleteFrom("users_teams")
      .where("team_id", "=", team.uuid)
      .execute();
  });

  it("should succeed with no affected rows when no users are in teams", async () => {
    await cleanTeamsMembers();
  });
});
