import { z } from "zod";

// Interface OvhRedirection
export const OvhRedirectionSchema = z.object({
    from: z.string(),
    to: z.string(),
    id: z.string(),
});
export type OvhRedirection = z.infer<typeof OvhRedirectionSchema>;

// Enum EMAIL_PLAN_TYPE
export const EMAIL_PLAN_TYPE = z.enum([
    "EMAIL_PLAN_PRO",
    "EMAIL_PLAN_EXCHANGE",
    "EMAIL_PLAN_BASIC",
]);
export type EMAIL_PLAN_TYPE = z.infer<typeof EMAIL_PLAN_TYPE>;

// Interface OvhMailingList
export const OvhMailingListSchema = z.object({
    id: z.string(),
});
export type OvhMailingList = z.infer<typeof OvhMailingListSchema>;

// Interface OvhResponder
export const OvhResponderSchema = z.object({
    account: z.string(),
    content: z.string(),
    copy: z.boolean(),
    from: z.date(),
    to: z.date(),
});
export type OvhResponder = z.infer<typeof OvhResponderSchema>;

// Interface OvhExchangeCreationData
export const OvhExchangeCreationDataSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    displayName: z.string().optional(),
    initial: z.string().optional(),
    company: z.string().optional(),
});
export type OvhExchangeCreationData = z.infer<
    typeof OvhExchangeCreationDataSchema
>;

// Interface OvhProCreationData
export const OvhProCreationDataSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    displayName: z.string().optional(),
    initial: z.string().optional(),
});
export type OvhProCreationData = z.infer<typeof OvhProCreationDataSchema>;
