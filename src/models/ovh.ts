import { z } from "zod";

// Enum EMAIL_PLAN_TYPE
export enum EMAIL_PLAN_TYPE {
  EMAIL_PLAN_OPI = "EMAIL_PLAN_OPI",
}

// Redirection type kept for compatibility (aliases from DIMAIL)
export const OvhRedirectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  id: z.string(),
});
export type OvhRedirection = z.infer<typeof OvhRedirectionSchema>;
