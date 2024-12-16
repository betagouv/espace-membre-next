import { z } from "zod";

import { EventCode } from "./actionEvent";
import { MatomoAccess } from "@/lib/matomo";
import { SentryRole } from "@/lib/sentry";
import { SERVICES } from "@/models/services";

export const EventServiceAccountDeletedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_DELETED),
    action_metadata: z.object({
        email: z.string(),
        service: z.nativeEnum(SERVICES),
    }),
});

const matomoActionMetadataSchema = z.object({
    service: z.literal(SERVICES.MATOMO),
    sites: z
        .array(
            z.object({
                id: z.number(),
                access: z.nativeEnum(MatomoAccess),
            })
        )
        .optional(),
    newSites: z
        .array(
            z.object({
                url: z.string().url(),
                access: z.nativeEnum(MatomoAccess),
            })
        )
        .optional(),
});

const sentryActionMetadataSchema = z.object({
    service: z.literal(SERVICES.SENTRY),
    teams: z.array(
        z.object({
            teamSlug: z.string(),
            teamRole: z.nativeEnum(SentryRole),
        })
    ),
});

// SENTRY
export const EventSentryAccountRequestedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED),
    action_metadata: sentryActionMetadataSchema,
});

export const EventSentryAccountCreatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_CREATED),
    action_metadata: sentryActionMetadataSchema,
});

export const EventSentryAccountUpdateRequestedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED),
    action_metadata: sentryActionMetadataSchema,
});

export const EventSentryAccountUpdatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED),
    action_metadata: sentryActionMetadataSchema,
});

// Matomo
export const EventMatomoAccountRequestedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED),
    action_metadata: matomoActionMetadataSchema,
});

export const EventMatomoAccountCreatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_CREATED),
    action_metadata: matomoActionMetadataSchema,
});

export const EventMatomoAccountUpdateRequestedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED),
    action_metadata: matomoActionMetadataSchema,
});

export const EventMatomoAccountUpdatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED),
    action_metadata: matomoActionMetadataSchema,
});
