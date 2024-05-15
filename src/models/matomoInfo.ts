import { z } from "zod";

const matomoInfoSchema = z.object({
    login: z.string(),
    email: z.string().email(),
    superuser_access: z.number().min(0).max(1), // Assuming this is a boolean flag stored as a number
    date_registered: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    invited_by: z.string(),
    invite_expired_at: z.string().nullable(), // Assuming it can be either a datetime string or null
    invite_accept_at: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    last_seen: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
    invite_status: z.enum(["active", "expired", "pending"]), // Define the possible statuses as an enum
    uses_2fa: z.boolean(),
});

export const matomoInfoDataSchema = z.object({
    primaryEmail: matomoInfoSchema.optional(),
    secondaryEmail: matomoInfoSchema.optional(),
});

export type matomoInfoDataSchemaType = z.infer<typeof matomoInfoDataSchema>;
