import { z } from "zod";

export const incubatorSchema = z.object({
    uuid: z.string(),
    // id: z.number(),
    title: z.string().min(1),
    owner_id: z.string(),
    contact: z.string().nullable().optional(),
    ghid: z.string().min(2),
    address: z.string().nullable().optional(),
    website: z.union([z.literal(""), z.string().trim().url()]),
    github: z.string().url().nullable().optional(),
    description: z.string(),
    short_description: z.string(),
});
export type incubatorSchemaType = z.infer<typeof incubatorSchema>;
