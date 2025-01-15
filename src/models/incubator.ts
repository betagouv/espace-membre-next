import { z } from "zod";

export const incubatorSchema = z.object({
    uuid: z.string(),
    // id: z.number(),
    title: z.string().min(1),
    owner_id: z.string().optional(),
    contact: z.string().nullable().optional(),
    ghid: z.string().min(2),
    address: z.string().nullable().optional(),
    website: z.string().url().optional().or(z.literal("")),
    github: z.string().url().optional().or(z.literal("")),
    description: z.string(),
    short_description: z.string(),
    highlighted_startups: z.array(z.string().uuid()).optional(),
    organization_name: z.string().optional(),
});
export type incubatorSchemaType = z.infer<typeof incubatorSchema>;
