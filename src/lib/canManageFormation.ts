import type { Session } from "next-auth";

import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";
import { Formation } from "@/models/formation";

// Les deux champs comparés sont de la chaîne libre côté Grist : la
// comparaison ignore la casse et les espaces.
const normalize = (value?: string) => (value ?? "").trim().toLowerCase();

/**
 * La personne connectée anime-t-elle cette formation ?
 *
 * Deux reconnaissances, qui n'ont pas la même valeur — à savoir avant de
 * toucher à cette fonction :
 *
 * - `animatorTchap` est écrit par le serveur au dépôt, depuis l'adresse de la
 *   session (voir submitFormationProposal). Il n'apparaît dans aucun champ de
 *   saisie : c'est le lien fiable entre une formation et qui l'a déposée.
 * - `animatorEmail` vient du champ « email organisateur·trice » du formulaire,
 *   donc du texte libre. Il ne prouve rien par lui-même. Il reste accepté ici
 *   parce qu'on ne peut l'écrire qu'en créant sa propre formation ou en
 *   modifiant une formation qu'on gère déjà : il transmet un droit qu'on a
 *   déjà, il n'en fabrique pas.
 *
 * C'est la raison pour laquelle ajouter ici une reconnaissance par un autre
 * champ de formulaire serait une faille, alors que celle-ci n'en est pas une.
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
