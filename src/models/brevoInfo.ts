import { z } from "zod";

const brevoEmailInfoSchema = z
    .object({
        email: z.string().email(),
        id: z.number(),
        emailBlacklisted: z.boolean(),
        smsBlacklisted: z.boolean(),
        createdAt: z.string(),
        modifiedAt: z.string(),
        listIds: z.array(z.number()),
    })
    .optional();

export const brevoEmailInfoDataSchema = z.object({
    primaryEmail: brevoEmailInfoSchema,
    secondaryEmail: brevoEmailInfoSchema,
});

export type brevoEmailInfoDataSchemaType = z.infer<
    typeof brevoEmailInfoDataSchema
>;
