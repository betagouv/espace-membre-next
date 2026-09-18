/**
 * Libellé du nombre d'inscrit·es à une session.
 *
 * Sans limite de participants, une fraction n'a pas de sens : on annonce le
 * décompte seul. Regroupé ici parce que trois écrans l'affichent, et qu'ils
 * divergeaient.
 */
export const libelleInscriptions = (
  inscrits: number,
  maxSeats?: number,
): string =>
  maxSeats
    ? `${inscrits}/${maxSeats}`
    : `${inscrits} inscrit·e${inscrits > 1 ? "s" : ""}`;
