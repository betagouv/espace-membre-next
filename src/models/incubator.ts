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
