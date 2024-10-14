import { z } from "zod";

const matomoUserAccessSchema = z.object({
    idSite: z.number(),
    name: z.string(),
    url: z.string().url(), // Ensures the URL is valid
    accessLevel: z.enum(["admin", "view"]), // Restricts accessLevel to "admin" or "view"
});

export const matomoUserMetadataSchema = z.object({
    sites: z.array(matomoUserAccessSchema),
});

export const matomoUserSchema = z.object({
    email: z.string(),
    account_type: z.literal("matomo"),
    service_user_id: z.string(),
    metadata: matomoUserMetadataSchema,
});

export type matomoUserSchemaType = z.infer<typeof matomoUserSchema>;
