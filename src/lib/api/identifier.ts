import { z } from "zod";

// Forme 8-4-4-4-12 hexadecimale. Ni la version ni le variant ne sont contraints :
// la base genere du v4, mais une ligne importee peut porter autre chose, et un
// ghid ne peut de toute facon pas prendre cette forme.
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID_PATTERN.test(value);

export type ResourceRef = { uuid: string } | { ghid: string };
export type MemberRef = { uuid: string } | { username: string };

// Le motif uuid est teste EN PREMIER : un identifiant qui a la forme d'un uuid
// est toujours lu comme un uuid, jamais comme un ghid. Regle deterministe,
// documentee dans l'OpenAPI, sans repli d'une interpretation sur l'autre.
/**
 * Garde runtime (422 avant tout aller-retour base) et `pattern` de l'OpenAPI.
 *
 * La classe de caracteres est UNICODE, pas ASCII : `startups.ghid` n'est
 * contraint par rien et la base porte des ghid accentues, importes de
 * beta.gouv.fr, comme `donnees-et-territoires` ou `e-inspe` dans leur graphie
 * reelle. Un motif ASCII rejetterait en 422 des identifiants parfaitement
 * valides. Ce qui compte ici est d'exclure l'espace et le separateur, pas les
 * diacritiques.
 */
const ID_PATTERN =
  /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}|[\p{L}\p{N}._-]+)$/u;

export const resourceIdSchema = z
  .string()
  .regex(ID_PATTERN, "Identifiant invalide : uuid ou ghid attendu.");

// Le parse est DANS la conversion : c'est le seul point de passage des cinq
// routes a segment dynamique, et withApiV1 traduit deja une ZodError en 422.
// Pose ailleurs, la garde serait a repeter dans chaque route et finirait par
// etre oubliee dans la prochaine.
export const toResourceRef = (raw: string): ResourceRef => {
  resourceIdSchema.parse(raw);
  return isUuid(raw) ? { uuid: raw } : { ghid: raw };
};

export const toMemberRef = (raw: string): MemberRef => {
  resourceIdSchema.parse(raw);
  return isUuid(raw) ? { uuid: raw } : { username: raw };
};
