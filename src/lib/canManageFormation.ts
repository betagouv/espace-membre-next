import type { Session } from "next-auth";

import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";
import { Formation } from "@/models/formation";

/**
 * Droit de voir le détail complet d'une formation et de le modifier.
 *
 * Deux profils : l'équipe d'animation, qui gère le catalogue, et la personne
 * qui anime la formation, qui doit pouvoir corriger ses propres informations.
 *
 * L'animateur·ice est reconnu·e par la partie locale de son adresse Tchap, qui
 * vaut le ghid, ou par l'email de l'organisateur·trice. Les deux sont saisis à
 * la main dans le formulaire : la comparaison ignore la casse et les espaces.
 */
const normalize = (value?: string) => (value ?? "").trim().toLowerCase();

/**
 * La personne connectée anime-t-elle cette formation ?
 *
 * Reconnue par la partie locale de son adresse Tchap, qui vaut le ghid, ou par
 * l'email de l'organisateur·trice. Les deux sont saisis à la main dans le
 * formulaire : la comparaison ignore la casse et les espaces.
 */
export const isFormationAnimator = (
  sessionUser: Session["user"] | undefined,
  formation: Pick<Formation, "animatorTchap" | "animatorEmail">,
): boolean => {
  if (!sessionUser?.uuid) return false;

  const ghid = normalize(sessionUser.id);
  const tchapGhid = normalize(formation.animatorTchap).split("@")[0];
  if (ghid && tchapGhid && ghid === tchapGhid) return true;

  const email = normalize(sessionUser.email);
  const animatorEmail = normalize(formation.animatorEmail);
  return !!email && !!animatorEmail && email === animatorEmail;
};

export const canManageFormation = async (
  sessionUser: Session["user"] | undefined,
  formation: Pick<Formation, "animatorTchap" | "animatorEmail">,
): Promise<boolean> => {
  if (!sessionUser?.uuid) return false;
  if (isFormationAnimator(sessionUser, formation)) return true;
  return isAnimationTeamMember(sessionUser);
};
