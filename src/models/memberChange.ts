import { z } from "zod";

export const privateMemberChangeSchema = z.object({
  created_at: z.date(),
  created_by_username: z.string(),
});

export type PrivateMemberChangeSchemaType = z.infer<
  typeof privateMemberChangeSchema
>;
