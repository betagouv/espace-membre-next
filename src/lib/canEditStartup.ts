import { getStartup, isStartupAgent } from "./kysely/queries";
import { getStartupIncubatorIds } from "./kysely/queries/incubators";
import { getIncubatorTeamMembers } from "./kysely/queries/teams";

export const canEditStartup = async (session, startupUuid: string | null) => {
  if (session.user.isAdmin) return true;
  if (!startupUuid) return false;
  const startup = await getStartup({ uuid: startupUuid });
  if (!startup) return false;

  // A startup can be co-incubated: a member of any linked incubator may edit it.
  const incubatorIds = await getStartupIncubatorIds(startupUuid);
  if (startup.incubator_id && !incubatorIds.includes(startup.incubator_id)) {
    incubatorIds.push(startup.incubator_id);
  }

  if (incubatorIds.length) {
    const teamMemberUuids = (
      await Promise.all(incubatorIds.map((id) => getIncubatorTeamMembers(id)))
    )
      .flat()
      .map((m) => m.uuid);
    if (teamMemberUuids.includes(session.user.uuid)) return true;
  }

  const isAgent = await isStartupAgent(session.user.uuid, startupUuid);
  if (isAgent) return true;
  return false;
};
