import { z } from "zod";

import { SERVICES } from "../services";

export const matomoAccountRequestSchema = z.object({
    sites: z.array(
        z.object({
            url: z.string(),
        })
    ),
});

export type matomoAccountRequestSchemaType = z.infer<
    typeof matomoAccountRequestSchema
>;

export const matomoAccountRequestWrapperSchema = z.object({
    data: matomoAccountRequestSchema,
    service: z.literal(SERVICES.MATOMO),
});

export type matomoAccountRequestWrapperSchemaType = z.infer<
    typeof matomoAccountRequestWrapperSchema
>;

export const sentryAccountRequestWrapperSchema = z.object({
    service: z.literal(SERVICES.SENTRY),
});

export type sentryAccountRequestWrapperSchemaType = z.infer<
    typeof sentryAccountRequestWrapperSchema
>;
