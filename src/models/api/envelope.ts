import { z } from "zod";

import { MAX_LIMIT } from "@/lib/api/pagination";
import { perimeterLabelSchema } from "./perimeter";

export const collectionMetaSchema = z.object({
  // Total APRES perimetre et filtres, AVANT limit/offset : c'est ce total qui
  // permet au client de paginer.
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1).max(MAX_LIMIT),
  offset: z.number().int().nonnegative(),
  perimeter: perimeterLabelSchema,
});
export type CollectionMeta = z.infer<typeof collectionMetaSchema>;

// Les enveloppes se construisent a partir du schema d'item, jamais l'inverse :
// l'item est enregistre dans le registre OpenAPI, l'enveloppe le reference en
// $ref, et le document reste lisible.
export const itemEnvelopeSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: item });

export const collectionEnvelopeSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item), meta: collectionMetaSchema });

/* Fabriques de reponses. Le parse est fait ici et nulle part ailleurs : une
   route qui oublie de valider sa sortie ne peut pas exister. */

export function jsonItem<T extends z.ZodTypeAny>(
  item: T,
  value: unknown,
  status = 200,
) {
  return Response.json({ data: item.parse(value) }, { status });
}

export function jsonCollection<T extends z.ZodTypeAny>(
  item: T,
  values: unknown[],
  meta: CollectionMeta,
) {
  return Response.json({
    data: z.array(item).parse(values),
    meta: collectionMetaSchema.parse(meta),
  });
}

/** Ecriture reussie sur une clef sans la portee de lecture correspondante. */
export const noContent = () => new Response(null, { status: 204 });
