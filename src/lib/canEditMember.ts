import { isAfter } from "date-fns";

import { getTeamsForUser } from "@/lib/kysely/queries/teams";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { Session } from "next-auth";

type CanEditMemberParams = {
  memberUuid: string;
  sessionUser: Session["user"];
  incubator_id?: string;
};

type UserStartups = Awaited<ReturnType<typeof getUserStartups>>;

/**
 * Checks if the session user belongs to an incubator team that the target user
 * is associated with (via startups or teams).
 *
 * Also returns the target user's startups so callers can reuse them.
 * Returns null when the target user cannot be found.
 */
const getIncubatorTeamAccess = async ({
  memberUuid,
  sessionUser,
  incubator_id,
}: CanEditMemberParams): Promise<{
  isIncubatorTeamMember: boolean;
  startups: UserStartups;
} | null> => {
  const targetUser = await getUserBasicInfo({ uuid: memberUuid });
  if (!targetUser) return null;

  const now = new Date();

  // Collect incubator IDs from the target user's current startups
  const startups = await getUserStartups(targetUser.uuid);
  const startupIncubatorIds = startups
    .filter((s) => isAfter(now, s.start ?? 0))
    .flatMap((s) => s.incubator_ids ?? []);

  // Collect incubator IDs from the target user's teams
  const teamIncubatorIds = (targetUser.teams ?? [])
    .filter((t) => t.incubator_id)
    .map((t) => t.incubator_id);

  // Combine all incubator IDs associated with the target user
  const userIncubatorIds = [
    ...new Set([incubator_id, ...startupIncubatorIds, ...teamIncubatorIds]),
  ].filter((id): id is string => !!id);

  // Get incubator IDs for the session user's teams
  const sessionUserIncubatorIds = (await getTeamsForUser(sessionUser.uuid))
    .map((t) => t.incubator_id)
    .filter((id): id is string => !!id);

  // Check if there's any overlap between incubator sets
  return {
    isIncubatorTeamMember: userIncubatorIds.some((id) =>
      sessionUserIncubatorIds.includes(id),
    ),
    startups,
  };
};

/**
 * Checks if the session user has permission to edit the whole profile of a
 * member (base infos, competences, missions...), not only its missions.
 *
 * Returns true if:
 * - The session user is an admin
 * - The session user belongs to an incubator team that the target user is associated with
 *   (via startups or teams)
 *
 * @param memberUuid - The UUID of the target user
 * @param sessionUser - The current session user
 * @param incubator_id - Optional additional incubator ID to include in the check
 * @returns true if the session user can edit all the target user's infos
 */
export const canEditMemberFullInfo = async (
  params: CanEditMemberParams,
): Promise<boolean> => {
  // Admin can always edit
  if (params.sessionUser.isAdmin) return true;

  const access = await getIncubatorTeamAccess(params);
  return !!access?.isIncubatorTeamMember;
};

/**
 * Checks if the session user has permission to edit a member's profile.
 *
 * Returns true if:
 * - The session user is an admin
 * - The session user belongs to an incubator team that the target user is associated with
 *   (via startups or teams)
 * - The session user and target user share a startup, AND the session user has a
 *   legal status of "contractuel" or "fonctionnaire"
 *
 * Only the first two cases can edit the whole profile, see `canEditMemberFullInfo`.
 *
 * @param memberUuid - The UUID of the target user
 * @param sessionUser - The current session user
 * @param incubator_id - Optional additional incubator ID to include in the check
 * @returns true if the session user can edit the target user
 */
export const canEditMember = async ({
  memberUuid,
  sessionUser,
  incubator_id,
}: CanEditMemberParams): Promise<boolean> => {
  // Admin can always edit
  if (sessionUser.isAdmin) return true;

  const access = await getIncubatorTeamAccess({
    memberUuid,
    sessionUser,
    incubator_id,
  });
  if (!access) return false;
  if (access.isIncubatorTeamMember) return true;

  const { startups } = access;
  const now = new Date();

  // Check if session user shares a startup with the target user
  // and the session user is contractuel or fonctionnaire
  const sessionUserInfo = await getUserBasicInfo({ uuid: sessionUser.uuid });
  if (!sessionUserInfo) return false;

  if (
    sessionUserInfo.legal_status === "contractuel" ||
    sessionUserInfo.legal_status === "fonctionnaire"
  ) {
    const sessionUserStartups = await getUserStartups(sessionUser.uuid);
    const sessionUserStartupIds = sessionUserStartups
      .filter((s) => isAfter(now, s.start ?? 0))
      .map((s) => s.uuid);

    const userStartupIds = startups
      .filter((s) => isAfter(now, s.start ?? 0))
      .map((s) => s.uuid);

    if (userStartupIds.some((id) => sessionUserStartupIds.includes(id))) {
      return true;
    }
  }

  return false;
};
