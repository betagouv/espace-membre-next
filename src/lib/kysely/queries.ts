import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all startups */
export function getAllStartups() {
  return db.selectFrom("startups").selectAll().execute();
}

/** Return all startups */
export async function getStartup(params: { ghid: string } | { uuid: string }) {
  let query = db.selectFrom("startups").selectAll();

  if ("ghid" in params) {
    query = query.where("startups.ghid", "=", params.ghid);
  } else {
    query = query.where("startups.uuid", "=", params.uuid);
  }
  const startups = await db.executeQuery(query);

  return (startups.rows.length && startups.rows[0]) || undefined;
}

/**
 * return true if the user is active in the given startup and is public agent
 */
export const isStartupAgent = async (memberId: string, startupId: string) => {
  const isStartupAgentQuery = db
    .selectFrom("users")
    .select(["users.uuid", "users.legal_status"])
    .rightJoin("missions", "missions.user_id", "users.uuid")
    .rightJoin(
      "missions_startups",
      "missions_startups.mission_id",
      "missions.uuid",
    )
    .where("users.uuid", "=", memberId)
    .where("missions_startups.startup_id", "=", startupId)
    .where("missions.start", "<=", new Date())
    .where("missions.end", ">", new Date())
    .where("users.legal_status", "in", ["fonctionnaire", "contractuel"]);

  const result = await isStartupAgentQuery.execute();
  return result.length > 0;
};
