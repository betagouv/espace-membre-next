import { z } from "zod";

export const privateMemberChangeSchema = z.object({
    action_on_username: z.string().nullable(),
    created_at: z.date(),
    created_by_username: z.string(),
});

export type PrivateMemberChangeSchemaType = z.infer<
    typeof privateMemberChangeSchema
>;
