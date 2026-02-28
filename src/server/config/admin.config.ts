import { isAfter } from "date-fns";

import config from ".";
import { getTeamsForUser } from "@/lib/kysely/queries/teams";
import { getUserStartups } from "@/lib/kysely/queries/users";
import { memberBaseInfoSchemaType } from "@/models/member";

export const getAdmin = () => {
  return config.ESPACE_MEMBRE_ADMIN;
};

/**
 * Checks if the session user belongs to any incubator that the target user is associated with.
 * This is used to determine if the session user has admin rights over the target user
 * based on shared incubator membership.
 *
 * @param user - The target user to check permissions for
 * @param sessionUserUuid - The UUID of the current session user
 * @param incubator_id - Optional additional incubator ID to include in the check
 * @returns true if the session user shares at least one incubator with the target user
 */
export const isSessionUserIncubatorTeamAdminForUser = async ({
  user,
  sessionUserUuid,
  incubator_id,
}: {
  user: { teams?: memberBaseInfoSchemaType["teams"]; uuid: string };
  sessionUserUuid: string;
  incubator_id?: string;
}): Promise<boolean> => {
  const now = new Date();

  // Collect incubator IDs from the target user's current startups
  const startups = await getUserStartups(user.uuid);
  const startupIncubatorIds = startups
    .filter((s) => s.incubator_id && isAfter(now, s.start ?? 0))
    .map((s) => s.incubator_id);

  // Collect incubator IDs from the target user's teams
  const teamIncubatorIds = (user.teams ?? [])
    .filter((t) => t.incubator_id)
    .map((t) => t.incubator_id);

  // Combine all incubator IDs associated with the target user
  const userIncubatorIds = [
    ...new Set([incubator_id, ...startupIncubatorIds, ...teamIncubatorIds]),
  ].filter((id): id is string => !!id);

  // Get incubator IDs for the session user's teams
  const sessionUserIncubatorIds = (await getTeamsForUser(sessionUserUuid))
    .map((t) => t.incubator_id)
    .filter((id): id is string => !!id);

  // Check if there's any overlap between the two sets
  return userIncubatorIds.some((id) => sessionUserIncubatorIds.includes(id));
};
