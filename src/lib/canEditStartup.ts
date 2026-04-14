import { db } from "./kysely";
import { getStartup, isStartupAgent } from "./kysely/queries";
import { getIncubatorTeamMembers } from "./kysely/queries/teams";

export const canEditStartup = async (session, startupUuid: string | null) => {
  if (session.user.isAdmin) return true;
  if (!startupUuid) return false;
  const startup = await getStartup({ uuid: startupUuid });
  if (!startup) return false;
  if (!startup.incubator_id) return false;
  const isFromIncubatorTeam = (
    await getIncubatorTeamMembers(startup.incubator_id)
  )
    .map((m) => m.uuid)
    .includes(session.user.uuid);
  if (isFromIncubatorTeam) return true;
  const isAgent = await isStartupAgent(session.user.uuid, startupUuid);
  if (isAgent) return true;
  return false;
};
