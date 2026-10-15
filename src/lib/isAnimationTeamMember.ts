import type { Session } from "next-auth";

import { ANIMATION_TEAM_GHID } from "@/lib/canValidateRestrictedChecklistItem";
import { getTeamsForUser } from "@/lib/kysely/queries/teams";
import { getAdmin } from "@/server/config/admin.config";

/**
 * Appartenance à l'équipe d'animation de la DINUM, admins inclus en secours.
 *
 * Interroge la base et la configuration serveur : ne jamais se baser sur un
 * booléen porté par le client pour accorder un droit.
 */
export const isAnimationTeamMember = async (
  sessionUser?: Session["user"],
): Promise<boolean> => {
  if (!sessionUser?.uuid) return false;
  if (getAdmin().includes(sessionUser.id)) return true;

  const teams = await getTeamsForUser(sessionUser.uuid);
  return teams.some((team) => team.ghid === ANIMATION_TEAM_GHID);
};
