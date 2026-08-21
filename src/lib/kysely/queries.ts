import { db } from "@/lib/kysely";

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
    // Une fin nulle est une mission OUVERTE, donc vivante : `end > now` rend
    // NULL sur ces lignes et les rejetait. Le formulaire ne laisse justement
    // une mission sans terme qu'au statut « Agent Public »
    // (models/actions/member.ts:11-13), c'est-a-dire exactement la population
    // que ce predicat est cense reconnaitre. Meme lecture du NULL que
    // liveMission, getActiveUsers, incubatorMembersBase et checkUserIsExpired.
    .where((eb) =>
      eb.or([
        eb("missions.end", "is", null),
        eb("missions.end", ">", new Date()),
      ]),
    )
    .where("users.legal_status", "in", ["fonctionnaire", "contractuel"]);

  const result = await isStartupAgentQuery.execute();
  return result.length > 0;
};
