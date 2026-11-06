import { isAfter, startOfDay } from "date-fns";

import { AuthorizationError } from "@/lib/error";
import { getUserTeamIncubatorIds } from "@/lib/kysely/queries/authorization";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";

import { AuthSubject, requireAuthSubject } from "./subject";

type MemberEditParams = {
  memberUuid: string;
  sessionUser: Pick<AuthSubject, "uuid" | "isAdmin">;
  incubator_id?: string;
};

/**
 * Checks if the session user belongs to an incubator team that the target user
 * is associated with (via current startups or teams).
 *
 * Also returns the target user's startups so callers can reuse them.
 * Returns null when the target user cannot be found.
 */
const getIncubatorTeamAccess = async ({
  memberUuid,
  sessionUser,
  incubator_id,
}: MemberEditParams) => {
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
  const sessionUserIncubatorIds = await getUserTeamIncubatorIds(
    sessionUser.uuid,
  );

  return {
    isIncubatorTeamMember: userIncubatorIds.some((id) =>
      sessionUserIncubatorIds.includes(id),
    ),
    startups,
  };
};

/**
 * Checks if the session user has permission to edit the whole profile of a
 * member (base infos, legal status, competences, photo, missions), not only its
 * missions.
 *
 * Returns true if:
 * - The session user is an admin
 * - The session user belongs to an incubator team that the target user is associated with
 *   (via startups or teams)
 */
export const canEditMemberFullInfo = async (
  params: MemberEditParams,
): Promise<boolean> => {
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
}: MemberEditParams): Promise<boolean> => {
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

/**
 * canEditMember ouvre l'edition complete des missions. Sinon, sa propre fiche,
 * ou une fiche sans mission en cours ni a venir : c'est le parcours « Mettre a
 * jour les missions » que MemberExpirationNotice propose a tout membre pour
 * faire revenir quelqu'un. Dans ces deux cas, une mission existante ne peut pas
 * etre raccourcie. Ajouter une mission ou changer ses produits reste possible.
 */
export async function getMemberMissionsRight(
  subject: Pick<AuthSubject, "uuid" | "isAdmin">,
  member: { uuid: string; missions: { end?: Date | null }[] },
): Promise<"full" | "extend" | null> {
  if (await canEditMember({ memberUuid: member.uuid, sessionUser: subject })) {
    return "full";
  }
  if (subject.uuid === member.uuid) return "extend";
  // Meme borne que checkUserIsExpired : la fiche reste active tout le dernier
  // jour de mission. Les fins arrivent a minuit UTC, `end >= now` la donnait
  // expiree des le matin.
  const today = startOfDay(new Date());
  const hasCurrentOrFutureMission = member.missions.some(
    (m) => !m.end || startOfDay(m.end) >= today,
  );
  return hasCurrentOrFutureMission ? null : "extend";
}

/** Sa propre fiche, ou canEditMemberFullInfo. */
export async function assertCanEditMemberFullInfo(memberUuid: string) {
  const subject = await requireAuthSubject();
  if (
    subject.uuid !== memberUuid &&
    !(await canEditMemberFullInfo({
      memberUuid,
      sessionUser: subject,
    }))
  ) {
    throw new AuthorizationError();
  }
  return subject;
}

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
