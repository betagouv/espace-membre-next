import { AuthorizationError } from "@/lib/error";
import { getStartup, isStartupAgent } from "@/lib/kysely/queries";
import { isIncubatorTeamMember } from "@/lib/kysely/queries/authorization";
import { getStartupIncubatorIds } from "@/lib/kysely/queries/incubators";

import { AuthSubject, requireAuthSubject } from "./subject";

export const canEditStartup = async (
  subject: AuthSubject,
  startupUuid: string | null,
): Promise<boolean> => {
  if (subject.isAdmin) return true;
  if (!startupUuid) return false;
  const startup = await getStartup({ uuid: startupUuid });
  if (!startup) return false;

  // Co-incubation : un membre d'equipe de N'IMPORTE QUEL incubateur lie peut
  // editer. Le principal fait toujours partie de la liste, la contrainte
  // startups_principal_incubator_linked le garantit.
  for (const incubatorId of await getStartupIncubatorIds(startupUuid)) {
    if (await isIncubatorTeamMember(subject.uuid, incubatorId)) return true;
  }

  return isStartupAgent(subject.uuid, startupUuid);
};

export async function assertCanEditStartup(startupUuid: string | null) {
  const subject = await requireAuthSubject();
  if (!(await canEditStartup(subject, startupUuid))) {
    throw new AuthorizationError();
  }
  return subject;
}
