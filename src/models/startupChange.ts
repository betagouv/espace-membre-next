import { z } from "zod";

export const StartupChangeSchema = z.object({
  created_at: z.date(),
  created_by_username: z.string(),
});

export type StartupChangeSchemaType = z.infer<typeof StartupChangeSchema>;
