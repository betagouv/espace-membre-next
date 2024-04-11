import { z } from "zod";

const brevoEmailEventSchema = z.object({
    email: z.string().email(),
    _date: z.string(),
    messageId: z.string(),
    event: z.string(),
    subject: z.string(),
    tag: z.string().optional(), // Assuming tag can be an empty string or optional
    ip: z.string(),
    from: z.string(),
});

export type brevoEmailEventSchemaType = z.infer<typeof brevoEmailEventSchema>;

export const brevoEmailEventDataSchema = z
    .object({
        primary_email: z.object({
            events: z.array(brevoEmailEventSchema).optional(),
        }),
        secondary_email: z.object({
            events: z.array(brevoEmailEventSchema).optional(),
        }),
    })
    .optional();

export type brevoEmailEventDataSchemaType = z.infer<
    typeof brevoEmailEventDataSchema
>;
