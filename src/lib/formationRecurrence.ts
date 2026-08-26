import { addMonths, addWeeks, format } from "date-fns";

import { FORMATION_RECURRENCE } from "@/models/formationsGrist";

/**
 * Dates d'une série, à partir de la première et du rythme choisi.
 *
 * Le calcul porte sur l'heure murale, jamais sur l'instant : « tous les mois à
 * 14 h » doit rester 14 h après le passage à l'heure d'hiver. Additionner des
 * durées à un instant décalerait les occurrences suivantes d'une heure.
 * L'entrée comme la sortie sont donc des dates sans fuseau, au format
 * `yyyy-MM-dd'T'HH:mm` — celui du champ du formulaire.
 *
 * Le mensuel s'appuie sur le quantième : une session du 31 janvier tombe le
 * 28 ou 29 février, `addMonths` ramenant la date au dernier jour du mois. Mieux
 * vaut une date proche à corriger qu'une occurrence qui saute.
 *
 * Sans récurrence, la série se réduit à sa première date : dupliquer une
 * formation à une autre date n'est qu'une série d'une occurrence.
 */
export const formationSessionDates = (
  first: string,
  recurrence: FORMATION_RECURRENCE,
  occurrences: number,
): string[] => {
  const count =
    recurrence === FORMATION_RECURRENCE.AUCUNE ? 1 : Math.max(1, occurrences);
  const start = new Date(first);
  if (Number.isNaN(start.getTime())) return [];

  return Array.from({ length: count }, (_, index) => {
    switch (recurrence) {
      case FORMATION_RECURRENCE.HEBDOMADAIRE:
        return addWeeks(start, index);
      case FORMATION_RECURRENCE.BIMENSUELLE:
        return addWeeks(start, index * 2);
      case FORMATION_RECURRENCE.MENSUELLE:
        return addMonths(start, index);
      default:
        return start;
    }
  }).map((date) => format(date, "yyyy-MM-dd'T'HH:mm"));
};
