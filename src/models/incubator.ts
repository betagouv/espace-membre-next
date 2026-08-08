import { z } from "zod";

export const incubatorSchema = z.object({
  uuid: z.string(),
  // id: z.number(),
  title: z.string().min(3, "Le nom de l'incubateur est obligatoire"),
  owner_id: z.string().optional(),
  contact: z
    .string()
    .email({ message: "Email invalide" })
    .nullable()
    .optional(),
  ghid: z.string().min(2, "Un acronyme est obligatoire"),
  address: z.string().nullable().optional(),
  website: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  description: z.string().min(100, "Une description est obligatoire"),
  short_description: z
    .string()
    .min(30, "Une description courte est obligatoire"),
  highlighted_startups: z.array(z.string().uuid()).optional(),
  organization_name: z.string().optional(),
});
export type incubatorSchemaType = z.infer<typeof incubatorSchema>;

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
