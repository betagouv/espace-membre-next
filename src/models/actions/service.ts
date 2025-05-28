import { z } from "zod";

import { SERVICES } from "../services";

export enum MATOMO_SITE_TYPE {
  "website" = "website",
  "mobileapp" = "mobileapp",
}

export const matomoAccountRequestSchema = z.object({
  sites: z
    .array(
      z.object({
        id: z.number(),
      }),
    )
    .optional()
    .refine((sites) => !sites || sites.length > 0, {
      message: "If sites is defined, it must contain at least one element",
    }),
  newSite: z
    .object({
      url: z.string().url(),
      type: z.nativeEnum(MATOMO_SITE_TYPE),
      name: z.string().min(1).max(90).optional(),
      startupId: z.string(),
    })
    .optional()
    .refine(
      (data) =>
        !data || data.type !== MATOMO_SITE_TYPE.mobileapp || !!data.name,
      {
        message: "Name is required if type is 'App mobile'",
        path: ["name"],
      },
    ),
});

export type matomoAccountRequestSchemaType = z.infer<
  typeof matomoAccountRequestSchema
>;

export const sentryAccountCreateRequestSchema = z.object({
  newTeam: z.object({
    startupId: z.string().uuid(),
  }),
});

export type sentryAccountCreateRequestSchemaType = z.infer<
  typeof sentryAccountCreateRequestSchema
>;

export const sentryAccountJoinTeamRequestSchema = z.object({
  teams: z
    .array(
      z.object({
        slug: z.string(),
      }),
    )
    .min(1, { message: "Au moins une équipe est nécessaire." }),
});

export const sentryAccountRequestSchema = z.union([
  sentryAccountJoinTeamRequestSchema,
  sentryAccountCreateRequestSchema,
]);

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
  data: z.union([
    sentryAccountCreateRequestSchema,
    sentryAccountJoinTeamRequestSchema,
  ]),
});

export type sentryAccountRequestWrapperSchemaType = z.infer<
  typeof sentryAccountRequestWrapperSchema
>;
