import { AuthorizationError } from "@/lib/error";
import {
  getIncubatorTeamMembersWithMissions,
  getUserMissionEnds,
  isIncubatorTeamMember,
} from "@/lib/kysely/queries/authorization";
import { checkUserIsExpired } from "@/lib/utils";

import { AuthSubject, requireAuthSubject } from "./subject";

export async function canEditIncubator(
  subject: AuthSubject,
  incubatorUuid: string,
): Promise<boolean> {
  if (subject.isAdmin) return true;
  return isIncubatorTeamMember(subject.uuid, incubatorUuid);
}

export async function assertCanEditIncubator(incubatorUuid: string) {
  const subject = await requireAuthSubject();
  if (!(await canEditIncubator(subject, incubatorUuid))) {
    throw new AuthorizationError();
  }
  return subject;
}

// json_agg rend les dates en chaines : on remappe avant checkUserIsExpired, dont
// le reduce compare des valeurs brutes.
const isAlive = (missions: { end: string | Date | null }[]) =>
  !checkUserIsExpired(
    {
      missions: missions.map((m) => ({ end: m.end ? new Date(m.end) : null })),
    } as never,
    1,
  );

/** Responsable d'incubateur : membre d'une equipe de cet incubateur ET vivant. */
export async function isIncubatorLead(
  userUuid: string,
  incubatorUuid: string,
): Promise<boolean> {
  if (!(await isIncubatorTeamMember(userUuid, incubatorUuid))) return false;
  return isAlive(await getUserMissionEnds(userUuid));
}

/** Equipe vivante d'un incubateur : destinataires des courriels d'equipe. */
export async function getLivingIncubatorTeamMembers(incubatorUuid: string) {
  const rows = await getIncubatorTeamMembersWithMissions(incubatorUuid);
  return rows.filter((row) => isAlive(row.mission_ends));
}
