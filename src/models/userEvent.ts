import { z } from "zod";

export const userEventSchema = z.object({
  uuid: z.string().uuid(), // généré automatiquement
  field_id: z.string().min(1), // non nullable
  date: z.date(),
  user_id: z.string().uuid(), // non nullable
  // Renseigné quand le membre s'est déclaré « non concerné » par l'item :
  // l'item compte alors comme fait dans la progression.
  not_concerned_reason: z.string().nullable(),
  not_concerned_comment: z.string().nullable(),
  created_at: z.date(), // généré par knex
  updated_at: z.date(), // généré par knex
});

export type userEventSchemaType = z.infer<typeof userEventSchema>;
