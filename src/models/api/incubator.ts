import { z } from "zod";

// Schema de reponse pour l'API protegee /api/protected/incubators.
// Volontairement permissif (pas de contraintes de longueur metier) : il decrit
// le contrat de sortie et ne doit jamais rejeter des donnees valides en base.
export const incubatorApiResponseSchema = z.object({
  uuid: z.string(),
  title: z.string(),
  ghid: z.string(),
  short_description: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
});
export type incubatorApiResponseSchemaType = z.infer<
  typeof incubatorApiResponseSchema
>;
