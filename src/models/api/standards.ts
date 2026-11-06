import { z } from "zod";

import { isUnsafeUrl, UNSAFE_URL_MESSAGE } from "@/models/startupUrl";

// Les 10 champs de standards, sur les memes types que la base. Aucun .url() sur
// les URL : src/models/startup.ts les type en z.string() nu, le formulaire
// accepte donc la chaine vide et des chaines libres, qui sont deja en base. Un
// .url() ici rejetterait en 422 des lignes parfaitement valides, casserait le
// cycle lire-modifier-ecrire du PUT, et contredirait la regle posee en tete de
// src/models/api/incubator.ts : un schema de sortie ne rejette jamais des
// donnees valides en base.
export const startupStandardsSchema = z.object({
  // Les quatre colonnes varchar(255) des standards. Les six autres champs du
  // schema sont en text ou en boolean, donc sans borne a reporter ici.
  accessibility_status: z.string().max(255).nullable(),
  dsfr_status: z.string().max(255).nullable(),
  mon_service_securise: z.boolean().nullable(),
  analyse_risques: z.boolean().nullable(),
  analyse_risques_url: z.string().nullable(),
  dashlord_url: z.string().nullable(),
  tech_audit_url: z.string().max(255).nullable(),
  ecodesign_url: z.string().max(255).nullable(),
  stats: z.boolean().nullable(),
  stats_url: z.string().nullable(),
});
export type startupStandardsSchemaType = z.infer<typeof startupStandardsSchema>;

// En entree seulement : un schema de sortie ne rejette pas une valeur deja en
// base. Ces URL vivent dans startup_urls, ou le formulaire refuse les memes.
const STANDARDS_URL_FIELDS = [
  "analyse_risques_url",
  "dashlord_url",
  "tech_audit_url",
  "ecodesign_url",
  "stats_url",
] as const;
const rejectUnsafeUrls = (
  values: Partial<Record<(typeof STANDARDS_URL_FIELDS)[number], string | null>>,
  ctx: z.RefinementCtx,
) => {
  for (const field of STANDARDS_URL_FIELDS) {
    const url = values[field];
    if (url && isUnsafeUrl(url)) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: UNSAFE_URL_MESSAGE,
      });
    }
  }
};

// Corps du PUT : remplacement complet.
export const startupStandardsPutSchema =
  startupStandardsSchema.superRefine(rejectUnsafeUrls);

// RFC 7396 : un champ absent conserve sa valeur, un champ a null l'efface.
// .partial() et non .deepPartial() : l'objet est plat.
export const startupStandardsPatchSchema = startupStandardsSchema
  .partial()
  .superRefine(rejectUnsafeUrls);
export type startupStandardsPatchSchemaType = z.infer<
  typeof startupStandardsPatchSchema
>;

// La representation renvoyee porte uuid ET ghid, comme toute reponse de l'API :
// un client qui a resolu le produit par ghid doit pouvoir le correler par uuid
// sans second appel. Les deux champs sont en lecture seule, jamais acceptes en
// entree : le corps reste parse par les deux schemas ci-dessus.
export const startupStandardsResponseSchema = startupStandardsSchema.extend({
  uuid: z.string(),
  ghid: z.string(),
});
export type startupStandardsResponseSchemaType = z.infer<
  typeof startupStandardsResponseSchema
>;
