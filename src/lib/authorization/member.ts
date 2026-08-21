import { isAfter } from "date-fns";

import { AuthorizationError } from "@/lib/error";
import { getUserTeamIncubatorIds } from "@/lib/kysely/queries/authorization";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";

import { AuthSubject, requireAuthSubject } from "./subject";

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
 * @param memberUuid - The UUID of the target user
 * @param sessionUser - The current session user
 * @param incubator_id - Optional additional incubator ID to include in the check
 * @returns true if the session user can edit the target user
 */
export const canEditMember = async ({
  memberUuid,
  sessionUser,
  incubator_id,
}: {
  memberUuid: string;
  sessionUser: Pick<AuthSubject, "uuid" | "isAdmin">;
  incubator_id?: string;
}): Promise<boolean> => {
  // Admin can always edit
  if (sessionUser.isAdmin) return true;

  const targetUser = await getUserBasicInfo({ uuid: memberUuid });
  if (!targetUser) return false;

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
  const sessionUserIncubatorIds = await getUserTeamIncubatorIds(
    sessionUser.uuid,
  );

  // Check if there's any overlap between incubator sets
  if (userIncubatorIds.some((id) => sessionUserIncubatorIds.includes(id))) {
    return true;
  }

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

export async function assertCanEditMember(
  memberUuid: string,
  incubator_id?: string,
) {
  const subject = await requireAuthSubject();
  if (!(await canEditMember({ memberUuid, sessionUser: subject, incubator_id }))) {
    throw new AuthorizationError();
  }
  return subject;
}

/**
 * Volontairement pas canEditMember : un membre d'equipe qui peut editer une
 * fiche n'a aucune raison de voir les clefs personnelles de ce membre.
 */
export function canViewMemberApiKeys(subject: AuthSubject, memberUuid: string) {
  return subject.isAdmin || subject.uuid === memberUuid;
}
