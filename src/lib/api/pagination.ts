import { z } from "zod";

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  // Borne haute obligatoire : au-dela, pg refuse la valeur et la reponse serait
  // un 500 la ou un parametre de pagination invalide doit rendre 422.
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .max(Number.MAX_SAFE_INTEGER)
    .default(0),
});
export type Pagination = z.infer<typeof paginationSchema>;

// On lit les parametres un par un : un parametre absent doit rester undefined
// pour que .default() s'applique. searchParams.get() renvoie null, et
// z.coerce.number() transformerait ce null en 0, donc limit=0, donc un 422 sur
// toute requete sans parametre.
export const parsePagination = (searchParams: URLSearchParams) =>
  paginationSchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });
