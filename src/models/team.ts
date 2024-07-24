import { z } from "zod";

export const teamSchema = z.object({
    uuid: z.string(),
    // id: z.number(),
    name: z.string().min(1),
    mission: z.string().nullable().optional(),
    ghid: z.string().min(2),
    incubator_id: z.string(),
});
export type teamSchemaType = z.infer<typeof teamSchema>;
