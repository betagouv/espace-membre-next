import type { Session } from "next-auth";

import { getTeamsForUser } from "@/lib/kysely/queries/teams";
import { getAdmin } from "@/server/config/admin.config";

/**
 * ghid de l'équipe d'animation de la DINUM.
 *
 * Le `ghid` et pas le `name` : plusieurs incubateurs ont une équipe nommée
 * « Animation » (ANCT, Plateforme de l'inclusion, Ministère de la Culture,
 * Mission apprentissage...). Matcher sur le nom leur donnerait à toutes le
 * droit de valider l'embarquement de n'importe quel membre. `teams.ghid` porte
 * en plus une contrainte d'unicité et survit à un renommage.
 */
export const ANIMATION_TEAM_GHID = "dinum-animation-beta-gouv-fr";

/**
 * Droit de cocher/décocher un item de checklist marqué `restricted: true` dans
 * les yml de checklist.
 *
 * Le droit vient de l'appartenance à l'équipe d'animation en base. Les admins
 * le conservent, pour garder un recours si l'équipe est mal configurée.
 *
 * Interroge la base et la configuration serveur : ne jamais se baser sur un
 * booléen porté par le client pour autoriser l'écriture.
 */
export const canValidateRestrictedChecklistItem = async (
  sessionUser?: Session["user"],
): Promise<boolean> => {
  if (!sessionUser?.uuid) return false;
  if (getAdmin().includes(sessionUser.id)) return true;

  const teams = await getTeamsForUser(sessionUser.uuid);
  return teams.some((team) => team.ghid === ANIMATION_TEAM_GHID);
};
