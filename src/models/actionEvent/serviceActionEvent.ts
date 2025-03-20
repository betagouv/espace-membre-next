import { z } from "zod";

import { EventCode } from "./actionEvent";
import { MATOMO_SITE_TYPE } from "../actions/service";
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
    requestId: z.string().uuid(),
    jobId: z.string().nullable(),
    sites: z
        .array(
            z.object({
                id: z
                    .union([z.string(), z.number()]) // Allow both string and number
                    .transform((val) => Number(val)) // Convert to number
                    .refine((val) => !isNaN(val), {
                        // Ensure it's a valid number
                        message: "ID must be a valid number",
                    }),
                access: z.nativeEnum(MatomoAccess),
            })
        )
        .nullable()
        .optional(),
    newSite: z
        .object({
            url: z.string().url(),
            name: z.string().optional().nullable(),
            type: z.nativeEnum(MATOMO_SITE_TYPE),
            access: z.nativeEnum(MatomoAccess),
            startupId: z.string(),
        })
        .nullable()
        .optional(),
});

const sentryActionMetadataSchema = z.object({
    service: z.literal(SERVICES.SENTRY),
    requestId: z.string().uuid(),
    jobId: z.string().nullable(),
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

export const EventSentryCreateTeamRequestedTeamPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_TEAM_CREATION_REQUESTED),
    action_metadata: z.object({
        jobId: z.string().nullable(),
        service: z.literal(SERVICES.SENTRY),
        requestId: z.string().uuid(),
        startupId: z.string(),
        team: z.object({
            teamSlug: z.string(),
        }),
    }),
});

export const EventSentryAccountUpdateFailedUserDoesNotExistPayload = z.object({
    action_code: z.literal(
        EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_FAILED_USER_DOES_NOT_EXIST
    ),
    action_metadata: z.object({
        service: z.literal(SERVICES.SENTRY),
        requestId: z.string().uuid(),
        jobId: z.string().nullable(),
        teams: z.array(
            z.object({
                teamSlug: z.string(),
                teamRole: z.nativeEnum(SentryRole),
            })
        ),
    }),
});

export const EventSentryCreateTeamPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SERVICE_TEAM_CREATED),
    action_metadata: z.object({
        service: z.literal(SERVICES.SENTRY),
        requestId: z.string().uuid(),
        startupId: z.string(),
        jobId: z.string().nullable(),
        team: z.object({
            teamName: z.string(),
            teamSlug: z.string(),
        }),
    }),
});

export const EventMatomoAccountPayloadSchema = z.object({
    action_code: z.enum([
        EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED,
        EventCode.MEMBER_SERVICE_ACCOUNT_CREATED,
        EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED,
        EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED,
    ]),
    action_metadata: matomoActionMetadataSchema,
});

export type EventMatomoAccountPayloadSchemaType = z.infer<
    typeof EventMatomoAccountPayloadSchema
>;

export const EventSentryAccountPayloadSchema = z.object({
    action_code: z.enum([
        EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED,
        EventCode.MEMBER_SERVICE_ACCOUNT_CREATED,
        EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED,
        EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED,
        EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_FAILED_USER_DOES_NOT_EXIST,
    ]),
    action_metadata: sentryActionMetadataSchema,
});

export type EventSentryAccountPayloadSchemaType = z.infer<
    typeof EventSentryAccountPayloadSchema
>;
