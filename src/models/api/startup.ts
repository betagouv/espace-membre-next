import { z } from "zod";

import { incubatorApiResponseSchema } from "./incubator";

// Phase d'une startup exposee par l'API protegee. Le nom est brut : la liste des
// phases considerees comme terminales est une decision metier qui appartient au
// consommateur, l'API n'expose pas de booleen actif/inactif.
export const startupPhaseApiResponseSchema = z.object({
  name: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date().nullable(),
});
export type startupPhaseApiResponseSchemaType = z.infer<
  typeof startupPhaseApiResponseSchema
>;

// Schema de reponse pour l'API protegee /api/protected/startups.
// Projection ciblee et permissive : identite du produit et rattachement
// incubateur, sans les nombreuses URL internes. Il decrit le contrat de sortie.
// phases est ordonne chronologiquement (par date de debut) et current_phase
// reprend le nom de la derniere phase.
export const startupApiResponseSchema = z.object({
  uuid: z.string(),
  ghid: z.string(),
  name: z.string(),
  pitch: z.string().nullable().optional(),
  // incubator_id ne porte que l'incubateur principal, qui n'a pas de sens
  // metier : un produit co-incube expose tous les siens dans incubator_ids.
  incubator_id: z.string().nullable().optional(),
  incubator_ids: z.array(z.string()),
  contact: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  repository: z.string().nullable().optional(),
  mailing_list: z.string().nullable().optional(),
  accessibility_status: z.string().nullable().optional(),
  dsfr_status: z.string().nullable().optional(),
  techno: z.array(z.string()).optional(),
  thematiques: z.array(z.string()).optional(),
  usertypes: z.array(z.string()).optional(),
  phases: z.array(startupPhaseApiResponseSchema),
  current_phase: z.string().nullable(),
});
export type startupApiResponseSchemaType = z.infer<
  typeof startupApiResponseSchema
>;

// Startup enrichie de son incubateur, pour /api/protected/startups/{ghid}.
export const startupWithIncubatorApiResponseSchema =
  startupApiResponseSchema.extend({
    incubator: incubatorApiResponseSchema.nullable(),
    incubators: z.array(incubatorApiResponseSchema),
  });
export type startupWithIncubatorApiResponseSchemaType = z.infer<
  typeof startupWithIncubatorApiResponseSchema
>;

// Startup vue depuis un incubateur (/api/protected/incubators/{ghid}/startups) :
// meme contrat que /api/protected/startups restreint a l'identite du produit et
// a ses phases, pour garantir un ghid et un pitch coherents entre les deux routes.
export const incubatorStartupApiResponseSchema = startupApiResponseSchema.pick({
  uuid: true,
  ghid: true,
  name: true,
  pitch: true,
  phases: true,
  current_phase: true,
});
export type incubatorStartupApiResponseSchemaType = z.infer<
  typeof incubatorStartupApiResponseSchema
>;
