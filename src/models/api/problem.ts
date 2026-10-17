import { z } from "zod";

export const problemSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  // Extension RFC 9457, presente sur les seuls 422.
  errors: z
    .array(
      z.object({ pointer: z.string(), code: z.string(), detail: z.string() }),
    )
    .optional(),
});
export type problemSchemaType = z.infer<typeof problemSchema>;
