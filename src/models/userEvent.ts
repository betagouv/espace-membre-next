import { z } from "zod";

export const userEventSchema = z.object({
  uuid: z.string().uuid(), // généré automatiquement
  field_id: z.string().min(1), // non nullable
  date: z.date(),
  user_id: z.string().uuid(), // non nullable
  created_at: z.date(), // généré par knex
  updated_at: z.date(), // généré par knex
});

export type userEventSchemaType = z.infer<typeof userEventSchema>;
