import { AuthorizationError, NoDataError } from "@/lib/error";
import { isIncubatorTeamMember } from "@/lib/kysely/queries/authorization";
import { getTeam } from "@/lib/kysely/queries/teams";

import { AuthSubject, requireAuthSubject } from "./subject";

export async function canCreateTeam(
  subject: AuthSubject,
  incubatorUuid: string,
) {
  if (subject.isAdmin) return true;
  return isIncubatorTeamMember(subject.uuid, incubatorUuid);
}

export async function assertCanCreateTeam(incubatorUuid: string) {
  const subject = await requireAuthSubject();
  if (!(await canCreateTeam(subject, incubatorUuid)))
    throw new AuthorizationError();
  return subject;
}

/**
 * Le formulaire permet de deplacer une equipe d'un incubateur a un autre : il
 * faut les droits sur l'incubateur actuel ET sur l'incubateur cible, sinon un
 * membre de A rattache l'equipe a B et devient editeur de B.
 */
export async function assertCanEditTeam(
  teamUuid: string,
  nextIncubatorUuid: string,
) {
  const subject = await requireAuthSubject();
  const team = await getTeam(teamUuid);
  if (!team) throw new NoDataError("Cannot find team");
  const allowed =
    (await canCreateTeam(subject, team.incubator_id)) &&
    (await canCreateTeam(subject, nextIncubatorUuid));
  if (!allowed) throw new AuthorizationError();
  return { subject, team };
}
