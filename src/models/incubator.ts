import { z } from "zod";

export const incubatorSchema = z.object({
    uuid: z.string(),
    // id: z.number(),
    title: z.string().min(1),
    owner_id: z.string().optional(),
    contact: z.string().nullable().optional(),
    ghid: z.string().min(2),
    address: z.string().nullable().optional(),
    website: z.string().url().nullable().optional(),
    github: z.string().url().nullable().optional(),
});
export type incubatorSchemaType = z.infer<typeof incubatorSchema>;
