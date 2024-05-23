import { z } from "zod";

// export interface Incubator {
//     title: string;
//     owner: string;
//     contact: string;
//     address: string;
//     website: string;
//     github: string;
//     ghid: string;
//     // startups: Startup[];
// }

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
// Example TypeScript type extraction from Zod schema
export type incubatorSchemaType = z.infer<typeof incubatorSchema>;
