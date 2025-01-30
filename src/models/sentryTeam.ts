import { z } from "zod";

export const sentryTeamSchema = z
    .object({
        id: z.string(),
        name: z.string(),
        sentry_id: z.string(),
        slug: z.string(),
        startup_id: z.string().nullable(), // Nullable string
    })
    .strip();

// Example usage to infer the type
export type sentryTeamSchemaType = z.infer<typeof sentryTeamSchema>;
