import { z } from "zod";

import { ACCOUNT_SERVICE_STATUS } from "./services";

const matomoUserAccessSchema = z.object({
    id: z.number(),
    accessLevel: z.enum(["admin", "view"]), // Restricts accessLevel to "admin" or "view"
    name: z.string(),
    type: z.enum(["website", "app"]),
    url: z.string().optional(), // Optionalif can be an app
});

export const matomoUserMetadataSchema = z.object({
    sites: z.array(matomoUserAccessSchema),
});

export const matomoUserSchema = z.object({
    email: z.string(),
    account_type: z.literal("matomo"),
    service_user_id: z.string().optional(),
    metadata: matomoUserMetadataSchema,
    status: z.nativeEnum(ACCOUNT_SERVICE_STATUS),
});

export type matomoUserSchemaType = z.infer<typeof matomoUserSchema>;

export const matomoSiteSchema = z.object({
    id: z.number(),
    name: z.string(),
    type: z.enum(["website", "app"]),
    url: z.string().optional(),
});

export type matomoSiteSchemaType = z.infer<typeof matomoSiteSchema>;
