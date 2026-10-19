import { z } from "zod";

import { incubatorRefSchema } from "./incubator";

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

// Schema de reponse pour /api/v1/startups.
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
  // metier : un produit co-incube expose tous les siens dans incubators, qui
  // portent uuid ET ghid.
  incubator_id: z.string().nullable().optional(),
  incubators: z.array(incubatorRefSchema),
  contact: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  repository: z.string().nullable().optional(),
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

// Startup enrichie de son incubateur principal, pour /api/v1/startups/{id}.
// incubators est deja porte par le schema de base, au bon type : seul le
// principal s'ajoute ici.
export const startupWithIncubatorApiResponseSchema =
  startupApiResponseSchema.extend({
    incubator: incubatorRefSchema.nullable(),
  });
export type startupWithIncubatorApiResponseSchemaType = z.infer<
  typeof startupWithIncubatorApiResponseSchema
>;

// Startup vue depuis un incubateur (/api/v1/incubators/{id}/startups) :
// meme contrat que /api/v1/startups restreint a l'identite du produit et
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

// Corps accepte par PATCH /api/v1/startups/{id} (merge-patch RFC 7396) : champs
// descriptifs seulement. Ni ghid, ni incubator_id, ni les phases, ni les
// standards, qui ont leur propre endpoint.
export const startupPatchSchema = z
  .object({
    // startups.name est varchar(255) : sans cette borne, un depassement
    // remonte en 22001 depuis Postgres, donc en 500, au lieu d'un 422 pointe.
    name: z.string().min(1).max(255),
    pitch: z.string().nullable(),
    contact: z.string().nullable(),
    description: z.string().nullable(),
    link: z.string().nullable(),
    repository: z.string().nullable(),
    techno: z.array(z.string()),
    thematiques: z.array(z.string()),
    usertypes: z.array(z.string()),
  })
  .partial();
export type startupPatchSchemaType = z.infer<typeof startupPatchSchema>;
