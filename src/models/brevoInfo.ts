import { z } from "zod";

const brevoEmailInfoSchema = z.object({
  email: z.string().email(),
  id: z.number(),
  emailBlacklisted: z.boolean(),
  smsBlacklisted: z.boolean(),
  createdAt: z.string(),
  modifiedAt: z.string(),
  listIds: z.array(z.number()),
});

const brevoContactSchema = z.object({
  email: z.string().email(),
  reason: z.object({
    message: z.string(),
    code: z.enum([
      "hardBounce",
      "unsubscribedViaMA",
      "unsubscribedViaEmail",
      "adminBlocked",
      "unsubscribedViaApi",
      "contactFlaggedAsSpam",
    ]),
  }),
  blockedAt: z
    .string()
    .transform((val) => new Date(val)) // Transformation de string en Date
    .refine((date) => !isNaN(date.getTime()), {
      message: "Invalid date format",
    }), // Vérification que la date est valide
});

// Example usage:
// const data = SIBContactSchema.parse(inputData);

export const brevoEmailInfoDataSchema = z.object({
  primaryEmail: brevoEmailInfoSchema.optional(),
  secondaryEmail: brevoEmailInfoSchema.optional(),
  primaryEmailTransac: brevoContactSchema.optional(),
  secondaryEmailTransac: brevoContactSchema.optional(),
});

export type brevoEmailInfoDataSchemaType = z.infer<
  typeof brevoEmailInfoDataSchema
>;
