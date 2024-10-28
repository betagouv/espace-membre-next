import { z } from "zod";

export const newsletterSchema = z.object({
    created_at: z.date(),
    id: z.string(),
    sent_at: z.date().nullable(),
    url: z.string().url(),
    brevo_url: z.string().nullable(),
});

export type newsletterSchemaType = z.infer<typeof newsletterSchema>;
