import { z } from "zod";

// model just for migration
export const githubIncubatorSchema = z.object({
    title: z.string(),
    owner_id: z.string().optional(),
    contact: z.string(),
    id: z.string(),
    address: z.string(),
    website: z.string().url(),
    github: z.string().url(),
});
export type githubIncubatorSchemaType = z.infer<typeof githubIncubatorSchema>;

export const incubatorSchema = z.object({
    uuid: z.string(),
    // id: z.number(),
    title: z.string(),
    owner_id: z.string().optional(),
    contact: z.string(),
    ghid: z.string(),
    address: z.string(),
    website: z.string().url(),
    github: z.string().url(),
});
export type incubatorSchemaType = z.infer<typeof incubatorSchema>;
