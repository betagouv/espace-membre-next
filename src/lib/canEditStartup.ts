import { getStartup, isStartupAgent } from "./kysely/queries";
import { getStartupIncubatorIds } from "./kysely/queries/incubators";
import { getIncubatorTeamMembers } from "./kysely/queries/teams";

export const canEditStartup = async (session, startupUuid: string | null) => {
  if (session.user.isAdmin) return true;
  if (!startupUuid) return false;
  const startup = await getStartup({ uuid: startupUuid });
  if (!startup) return false;

  // A startup can be co-incubated: a member of any linked incubator may edit it.
  // The primary incubator is always part of that list, the database enforces it
  // through startups_principal_incubator_linked.
  const incubatorIds = await getStartupIncubatorIds(startupUuid);

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
