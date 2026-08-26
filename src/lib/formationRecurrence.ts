import {
  addMonths,
  addWeeks,
  format,
  getDate,
  getDay,
  getDaysInMonth,
  setDate,
  startOfMonth,
} from "date-fns";

import { FORMATION_FREQUENCE } from "@/models/formationsGrist";

export type FormationRecurrence = {
  frequence: FORMATION_FREQUENCE;
  // « Toutes les N semaines », « tous les N mois ».
  intervalle?: number;
  // Jour de la semaine imposé, numéroté comme `Date.getDay()` (0 = dimanche).
  // Vide : la série garde le jour de la date de départ.
  jour?: number;
  occurrences?: number;
};

/**
 * Énième occurrence d'un jour de la semaine dans un mois.
 *
 * Un mois n'a pas toujours cinq lundis : quand le rang demandé n'existe pas, on
 * prend le dernier du mois plutôt que de déborder sur le suivant, ce qui
 * ferait sauter une occurrence.
 */
const nthWeekdayOfMonth = (
  monthStart: Date,
  weekday: number,
  nth: number,
): Date => {
  const first = startOfMonth(monthStart);
  const offset = (weekday - getDay(first) + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return setDate(first, day > getDaysInMonth(first) ? day - 7 : day);
};

/** Avance jusqu'au jour de la semaine voulu, sans reculer. */
const nextWeekday = (date: Date, weekday: number): Date => {
  const offset = (weekday - getDay(date) + 7) % 7;
  return offset === 0 ? date : setDate(date, getDate(date) + offset);
};

/**
 * Dates d'une série, à partir de la première et du rythme choisi.
 *
 * Le calcul porte sur l'heure murale, jamais sur l'instant : « tous les mois à
 * 14 h » doit rester 14 h après le passage à l'heure d'hiver. Additionner des
 * durées à un instant décalerait les occurrences suivantes d'une heure.
 * L'entrée comme la sortie sont donc des dates sans fuseau, au format
 * `yyyy-MM-dd'T'HH:mm` — celui du champ du formulaire.
 *
 * Avec un jour de la semaine imposé, la première occurrence est avancée à ce
 * jour-là. En rythme mensuel, c'est son rang dans le mois qui est reconduit
 * — deuxième mardi, dernier vendredi — et non son quantième : « tous les mois
 * le mardi » n'a pas d'autre lecture raisonnable.
 *
 * Sans jour imposé, le mensuel s'appuie sur le quantième : une session du
 * 31 janvier tombe le 28 ou 29 février, `addMonths` ramenant la date au dernier
 * jour du mois. Mieux vaut une date proche à corriger qu'une occurrence qui
 * saute.
 *
 * Sans récurrence, la série se réduit à sa première date : dupliquer une
 * formation à une autre date n'est qu'une série d'une occurrence.
 */
export const formationSessionDates = (
  first: string,
  { frequence, intervalle = 1, jour, occurrences = 1 }: FormationRecurrence,
): string[] => {
  const parsed = new Date(first);
  if (Number.isNaN(parsed.getTime())) return [];

  const repeats = frequence !== FORMATION_FREQUENCE.AUCUNE;
  const count = repeats ? Math.max(1, occurrences) : 1;
  const step = Math.max(1, intervalle);

  // Le jour imposé décale la première occurrence, donc toute la série.
  const start =
    repeats && jour !== undefined ? nextWeekday(parsed, jour) : parsed;
  const rank = Math.ceil(getDate(start) / 7);

  return Array.from({ length: count }, (_, index) => {
    if (!repeats) return start;
    if (frequence === FORMATION_FREQUENCE.SEMAINE) {
      return addWeeks(start, index * step);
    }
    const month = addMonths(start, index * step);
    return jour === undefined ? month : nthWeekdayOfMonth(month, jour, rank);
  }).map((date) =>
    // Le rang d'un jour dans le mois se calcule sur la date seule : l'heure de
    // départ est reportée telle quelle sur chaque occurrence.
    format(date, `yyyy-MM-dd'T'${format(parsed, "HH:mm")}`),
  );
};
