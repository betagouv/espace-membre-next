import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { getExpiredUsers } from "@/lib/kysely/queries/users";

export const cleanTeamsMembersTopic = "clean-teams-members";

export async function cleanTeamsMembers(job?: PgBoss.Job<void>) {
  console.log("cleanTeamsMembers: start job clean incubators teams members");
  const query = db
    .deleteFrom("users_teams")
    .where(
      "user_id",
      "in",
      getExpiredUsers().clearSelect().select("users.uuid"),
    );

  const res = await query.executeTakeFirstOrThrow();

  console.log(
    "cleanTeamsMembers: users removed from incubator teams:",
    res.numDeletedRows,
  );
}
