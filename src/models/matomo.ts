import { z } from "zod";

export const matomoUserMetadataSchema = z.object({
    sites: z.array(z.string().url()),
});

export const matomoUserSchema = z.object({
    email: z.string(),
    metadata: matomoUserMetadataSchema,
});

export type matomoUserSchemaType = z.infer<typeof matomoUserSchema>;
