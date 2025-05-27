import { z } from "zod";

import { newsletterSchema } from "../newsletter";

export const newsletterInfoUpdateSchema = z.object({
  publish_at: newsletterSchema.shape.publish_at,
  brevo_url: newsletterSchema.shape.brevo_url,
});

export type newsletterInfoUpdateSchemaType = z.infer<
  typeof newsletterInfoUpdateSchema
>;
