import { expect } from "chai";
import { addDays, subDays } from "date-fns";

import {
  getIncubatorTeamMembersWithMissions,
  getUserTeamIncubatorIds,
  isIncubatorTeamMember,
} from "@/lib/kysely/queries/authorization";
import { getIncubatorTeamMembers } from "@/lib/kysely/queries/teams";
import { db } from "@/lib/kysely";

import { createData, deleteData, FakeDataInterface } from "./utils/fakeData";

const now = new Date();

const testData: FakeDataInterface = {
  incubators: [{ ghid: "qa-incub", title: "QA Incubateur" }],
  startups: [],
  teams: [
    { ghid: "qa-team-1", name: "Equipe 1", incubator: "qa-incub" },
    { ghid: "qa-team-2", name: "Equipe 2", incubator: "qa-incub" },
  ],
  users: [
    {
      username: "qa-two-teams",
      role: "Coach",
      teams: ["qa-team-1", "qa-team-2"],
      missions: [{ start: subDays(now, 30), end: addDays(now, 30) }],
    },
    {
      // Mission ouverte : c'est ce cas que getIncubatorTeamMembers exclut.
      username: "qa-open-mission",
      role: "Coach",
      teams: ["qa-team-1"],
      missions: [{ start: subDays(now, 30), end: addDays(now, 3650) }],
    },
    { username: "qa-no-team", role: "Coach", missions: [] },
  ],
};

describe("authorization queries", () => {
  let incubatorUuid: string;

  before(async () => {
    await createData(testData);
    incubatorUuid = (
      await db
        .selectFrom("incubators")
        .select("uuid")
        .where("ghid", "=", "qa-incub")
        .executeTakeFirstOrThrow()
    ).uuid;
    // Mission sans date de fin : le helper de test impose un end.
    const user = await db
      .selectFrom("users")
      .select("uuid")
      .where("username", "=", "qa-open-mission")
      .executeTakeFirstOrThrow();
    await db
      .updateTable("missions")
      .set({ end: null })
      .where("user_id", "=", user.uuid)
      .execute();
  });

  after(async () => {
    await deleteData(testData);
  });

  const uuidOf = (username: string) =>
    db
      .selectFrom("users")
      .select("uuid")
      .where("username", "=", username)
      .executeTakeFirstOrThrow();

  // La question est booleenne : deux equipes du meme incubateur ne doivent pas
  // rendre deux lignes.
  it("answers true exactly once for a user sitting in two teams of the same incubator", async () => {
    const user = await uuidOf("qa-two-teams");
    expect(await isIncubatorTeamMember(user.uuid, incubatorUuid)).to.be.true;
  });

  it("answers false for a user with no team", async () => {
    const user = await uuidOf("qa-no-team");
    expect(await isIncubatorTeamMember(user.uuid, incubatorUuid)).to.be.false;
  });

  it("returns [] and never [undefined] for a user with no team", async () => {
    const user = await uuidOf("qa-no-team");
    const ids = await getUserTeamIncubatorIds(user.uuid);
    expect(ids).to.deep.equal([]);
    expect(ids.every((id) => typeof id === "string")).to.be.true;
  });

  it("deduplicates the incubators of a user sitting in two of its teams", async () => {
    const user = await uuidOf("qa-two-teams");
    expect(await getUserTeamIncubatorIds(user.uuid)).to.deep.equal([
      incubatorUuid,
    ]);
  });

  /**
   * Demonstration du bug de teams.ts:50 : getIncubatorTeamMembers filtre deux
   * fois sur `end >= today`, ce qui exclut toutes les missions ouvertes. La
   * requete d'autorisation ne filtre plus sur les dates.
   */
  it("includes an open-ended mission where getIncubatorTeamMembers excludes it", async () => {
    const withMissions = await getIncubatorTeamMembersWithMissions(
      incubatorUuid,
    );
    const legacy = await getIncubatorTeamMembers(incubatorUuid);

    const usernames = withMissions.map((row) => row.username);
    expect(usernames, "membre a mission ouverte absent").to.include(
      "qa-open-mission",
    );
    expect(
      legacy.map((row) => row.username),
      "getIncubatorTeamMembers ne filtre plus les missions ouvertes",
    ).to.not.include("qa-open-mission");
  });

  it("carries the mission ends needed by the liveness computation", async () => {
    const rows = await getIncubatorTeamMembersWithMissions(incubatorUuid);
    const open = rows.find((row) => row.username === "qa-open-mission")!;
    expect(open.mission_ends).to.be.an("array");
    expect(open.mission_ends.some((mission) => mission.end === null)).to.be.true;
  });
});
