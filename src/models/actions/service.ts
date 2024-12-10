import { z } from "zod";

import { SERVICES } from "../services";

export const matomoAccountRequestSchema = z.object({
    sites: z
        .array(
            z.object({
                id: z.union([z.number(), z.undefined()]), // Allow undefined during form filling
            })
        )
        .refine(
            (sites) => sites.every((site) => typeof site.id === "number"), // Validate that all `id`s are numbers when submitting
            {
                message: "Each site must have a valid numeric ID",
            }
        )
        .optional(),
    newSites: z
        .array(
            z.object({
                url: z.string(),
            })
        )
        .optional(),
});

export type matomoAccountRequestSchemaType = z.infer<
    typeof matomoAccountRequestSchema
>;

export const sentryAccountRequestSchema = z.object({
    teams: z.array(
        z.object({
            name: z.string(),
        })
    ),
});

export type sentryAccountRequestSchemaType = z.infer<
    typeof sentryAccountRequestSchema
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
    data: sentryAccountRequestSchema,
});

export type sentryAccountRequestWrapperSchemaType = z.infer<
    typeof sentryAccountRequestWrapperSchema
>;
