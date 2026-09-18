import { Formation } from "@/models/formation";

type Carte = Pick<Formation, "start" | "isELearning" | "name">;

/**
 * Rang d'une carte au catalogue.
 *
 * Les dates à venir d'abord : c'est là que sont les nouveautés. Les formations
 * sans date programmée suivent. Les e-learning ferment la marche — toujours
 * disponibles, ils ne changent jamais, et les laisser remonter masquait tout
 * ce qui venait d'arriver.
 */
export const rangCatalogue = (carte: Carte): number =>
  carte.isELearning ? 2 : carte.start ? 0 : 1;

/**
 * Ordre du catalogue : par rang, puis par date la plus proche, puis par titre.
 *
 * Un comparateur qui renvoie 0 entre une carte datée et une carte sans date
 * n'est pas un ordre : deux cartes égales à une troisième ne le sont pas entre
 * elles, et le résultat dépend du moteur. D'où le rang, tranché avant tout.
 */
export const comparerAuCatalogue = (a: Carte, b: Carte): number => {
  const rang = rangCatalogue(a) - rangCatalogue(b);
  if (rang !== 0) return rang;
  if (a.start && b.start) return a.start.getTime() - b.start.getTime();
  return a.name.localeCompare(b.name, "fr");
};
