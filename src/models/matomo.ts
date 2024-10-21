import { z } from "zod";

const matomoUserAccessSchema = z.object({
    id: z.number(),
    accessLevel: z.enum(["admin", "view"]), // Restricts accessLevel to "admin" or "view"
    name: z.string(),
    type: z.enum(["website", "app"]), // Adjust if you have more types
    url: z.string().optional(), // Optionalif can be an app
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
