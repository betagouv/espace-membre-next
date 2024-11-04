import { z } from "zod";

import { ACCOUNT_SERVICE_STATUS } from "./services";

const sentryUserMetadataSchema = z.object({
    organisationRole: z.enum(["admin", "member", "manager", "owner"]),
    pending: z.boolean(),
    expired: z.boolean(),
    inviteStatus: z.enum(["approved", "pending"]),
    teams: z.array(
        z.object({
            role: z.enum(["admin", "contributor"]).nullable(), // role is null if users has highest privelege at organization level
            id: z.string(),
            slug: z.string(),
            name: z.string(),
            memberCount: z.number(),
            projects: z.array(
                z.object({
                    id: z.string(),
                    slug: z.string(),
                    name: z.string(),
                    plateform: z.string(),
                })
            ),
        })
    ),
});

export const sentryUserSchema = z.object({
    email: z.string(),
    account_type: z.literal("sentry"),
    service_user_id: z.string(),
    metadata: sentryUserMetadataSchema,
    status: z.nativeEnum(ACCOUNT_SERVICE_STATUS),
});

export type sentryUserSchemaType = z.infer<typeof sentryUserSchema>;
