import { db } from "./kysely";
import { getIncubatorTeamMembers } from "./kysely/queries/teams";

export const canEditStartup = async (session, startupUuid: string | null) => {
  if (session.user.isAdmin) return true;
  if (!startupUuid) return false;
  const startup = await db
    .selectFrom("startups")
    .select("incubator_id")
    .where("startups.uuid", "=", startupUuid)
    .executeTakeFirstOrThrow();
  if (!startup.incubator_id) return false;
  const isFromIncubatorTeam = (
    await getIncubatorTeamMembers(startup.incubator_id)
  )
    .map((m) => m.uuid)
    .includes(session.user.uuid);
  if (isFromIncubatorTeam) return true;
  return false;
  // todo allow startup members
};
