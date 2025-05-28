import { z } from "zod";

import { FileType } from "@/lib/file";
import { incubatorSchema } from "@/models/incubator";

export const incubatorUpdateSchema = z.object({
  incubator: z.object({
    title: incubatorSchema.shape.title,
    owner_id: incubatorSchema.shape.owner_id,
    contact: incubatorSchema.shape.contact,
    ghid: incubatorSchema.shape.ghid,
    address: incubatorSchema.shape.address,
    website: incubatorSchema.shape.website,
    github: incubatorSchema.shape.github,
    description: incubatorSchema.shape.description,
    short_description: incubatorSchema.shape.short_description,
    highlighted_startups: incubatorSchema.shape.highlighted_startups,
  }),
  logo: z
    .instanceof(FileType)
    .refine((file) => file.size > 0, "File is required")
    .nullable()
    .optional(),
  shouldDeleteLogo: z.boolean().optional(),
});

export type incubatorUpdateSchemaType = z.infer<typeof incubatorUpdateSchema>;
