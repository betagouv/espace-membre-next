import { z } from "zod";

export const matomoSiteSchema = z
  .object({
    id: z.string(),
    matomo_id: z.number(),
    name: z.string(),
    startup_id: z.string().nullable(), // Nullable string
    type: z.string(),
    url: z.string().url().nullable(), // Valid URL
  })
  .strip();

// Example usage to infer the type
export type matomoSiteSchemaType = z.infer<typeof matomoSiteSchema>;
