import { z } from "zod";

import {
    EventMatomoAccountPayloadSchema,
    EventSentryAccountCreatedPayload,
    EventSentryAccountRequestedPayload,
    EventSentryAccountUpdatedPayload,
    EventSentryAccountUpdateRequestedPayload,
    EventServiceAccountDeletedPayload,
    EventSentryCreateTeamPayload,
    EventSentryCreateTeamRequestedTeamPayload,
    EventSentryAccountUpdateFailedUserDoesNotExistPayload,
} from "./serviceActionEvent";
import {
    createMemberSchema,
    memberInfoUpdateSchema,
    memberValidateInfoSchema,
} from "../actions/member";
import { startupInfoUpdateSchema } from "../actions/startup";
import { CommunicationEmailCode } from "@/models/member";

export enum EventCode {
    MEMBER_REDIRECTION_CREATED = "MEMBER_REDIRECTION_CREATED",
    MEMBER_REDIRECTION_DELETED = "MEMBER_REDIRECTION_DELETED",
    MEMBER_EMAIL_CREATED = "MEMBER_EMAIL_CREATED",
    MEMBER_EMAIL_DELETED = "MEMBER_EMAIL_DELETED",
    MEMBER_EMAIL_EXPIRED = "MEMBER_EMAIL_EXPIRED",
    MEMBER_PASSWORD_UPDATED = "MEMBER_PASSWORD_UPDATED",
    MEMBER_RESPONDER_CREATED = "MEMBER_RESPONDER_CREATED",
    MEMBER_RESPONDER_UPDATED = "MEMBER_RESPONDER_UPDATED",
    MEMBER_RESPONDER_DELETED = "MEMBER_RESPONDER_DELETED",
    MARRAINAGE_CREATED = "MARRAINAGE_CREATED",
    MARRAINAGE_ACCEPTED = "MARRAINAGE_ACCEPTED",
    MEMBER_MARRAINAGE_DECLINED = "MEMBER_MARRAINAGE_DECLINED",
    MEMBER_SECONDARY_EMAIL_UPDATED = "MEMBER_SECONDARY_EMAIL_UPDATED",
    MEMBER_PRIMARY_EMAIL_UPDATED = "MEMBER_PRIMARY_EMAIL_UPDATED",
    MEMBER_END_DATE_UPDATED = "MEMBER_END_DATE_UPDATED",
    MEMBER_COMMUNICATION_EMAIL_UPDATE = "MEMBER_COMMUNICATION_EMAIL_UPDATE",
    MEMBER_EMAIL_RECREATED = "MEMBER_EMAIL_RECREATED",
    MEMBER_EMAIL_UPGRADED = "MEMBER_EMAIL_UPGRADED",
    MEMBER_BASE_INFO_UPDATED = "MEMBER_BASE_INFO_UPDATED",
    MEMBER_UNBLOCK_EMAIL = "MEMBER_UNBLOCK_EMAIL",
    STARTUP_PHASE_UPDATED = "STARTUP_PHASE_UPDATED",
    STARTUP_INFO_UPDATED = "STARTUP_INFO_UPDATED",
    STARTUP_INFO_CREATED = "STARTUP_INFO_CREATED",
    TEAM_CREATED = "TEAM_CREATED",
    TEAM_UPDATED = "TEAM_UPDATED",
    EMAIL_VERIFICATION_WAITING_SENT = "EMAIL_VERIFICATION_WAITING_SENT",
    ORGANIZATION_CREATED = "ORGANIZATION_CREATED",
    ORGANIZATION_UPDATED = "ORGANIZATION_UPDATED",
    MEMBER_SERVICE_ACCOUNT_DELETED = "MEMBER_SERVICE_ACCOUNT_DELETED",
    MEMBER_SERVICE_ACCOUNT_REQUESTED = "MEMBER_SERVICE_ACCOUNT_REQUESTED",
    MEMBER_SERVICE_ACCOUNT_CREATED = "MEMBER_SERVICE_ACCOUNT_CREATED",
    MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED = "MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED",
    MEMBER_SERVICE_ACCOUNT_UPDATED = "MEMBER_SERVICE_ACCOUNT_UPDATED",
    MEMBER_SERVICE_TEAM_CREATED = "MEMBER_SERVICE_TEAM_CREATED",
    MEMBER_SERVICE_TEAM_CREATION_REQUESTED = "MEMBER_SERVICE_TEAM_CREATION_REQUESTED",
    MEMBER_SERVICE_ACCOUNT_UPDATE_FAILED_USER_DOES_NOT_EXIST = "MEMBER_SERVICE_ACCOUNT_UPDATE_FAILED_USER_DOES_NOT_EXIST",
    MEMBER_CREATED = "MEMBER_CREATED",
    MEMBER_VALIDATED = "MEMBER_VALIDATED",
}

export const EventCodeToReadable: Record<EventCode, string> = {
    [EventCode.MEMBER_REDIRECTION_CREATED]: "Redirection email créé",
    [EventCode.MEMBER_REDIRECTION_DELETED]: "Redirection email supprimé",
    [EventCode.MEMBER_EMAIL_CREATED]: "Email créé",
    [EventCode.MEMBER_EMAIL_DELETED]: "Email supprimé",
    [EventCode.MEMBER_PASSWORD_UPDATED]: "Mot de passe mis à jour",
    [EventCode.MEMBER_RESPONDER_CREATED]: "Réponse automatique créé",
    [EventCode.MEMBER_RESPONDER_UPDATED]: "Réponse automatique mise à jour",
    [EventCode.MEMBER_RESPONDER_DELETED]: "Réponse automatique supprimé",
    [EventCode.MARRAINAGE_CREATED]: "Marrainage créé",
    [EventCode.MARRAINAGE_ACCEPTED]: "Marrainage accepté",
    [EventCode.MEMBER_MARRAINAGE_DECLINED]: "Marrainage décliné",
    [EventCode.MEMBER_SECONDARY_EMAIL_UPDATED]: "Email secondaire mis à jour",
    [EventCode.MEMBER_PRIMARY_EMAIL_UPDATED]: "Email primaire mis à jour",
    [EventCode.MEMBER_END_DATE_UPDATED]: "Date de fin mis à jour",
    [EventCode.MEMBER_COMMUNICATION_EMAIL_UPDATE]:
        "Email de communication mis à jour",
    [EventCode.MEMBER_EMAIL_RECREATED]: "Email re-créé",
    [EventCode.MEMBER_EMAIL_UPGRADED]: "Email mis à jour",
    [EventCode.MEMBER_BASE_INFO_UPDATED]: "Info de base mis à jour",
    [EventCode.MEMBER_UNBLOCK_EMAIL]: "Email débloqué de brevo",
    [EventCode.STARTUP_PHASE_UPDATED]: "Phase de startup mis à jour",
    [EventCode.STARTUP_INFO_UPDATED]: "Info de startup mis à jour",
    [EventCode.STARTUP_INFO_CREATED]: "Fiche de startup crée",
    [EventCode.TEAM_CREATED]: "Team créée",
    [EventCode.TEAM_UPDATED]: "Team mise à jour",
    [EventCode.EMAIL_VERIFICATION_WAITING_SENT]:
        "Email de fiche à vérifier envoyé",
    [EventCode.ORGANIZATION_CREATED]: "Organization créée",
    [EventCode.ORGANIZATION_UPDATED]: "Organization mise à jour",
    [EventCode.MEMBER_SERVICE_ACCOUNT_DELETED]: "Compte de service supprimé",
    [EventCode.MEMBER_EMAIL_EXPIRED]: "Compte défini comme expiré",
    [EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED]: "Compte de service demandé",
    [EventCode.MEMBER_SERVICE_ACCOUNT_CREATED]: "Compte de service créé",
    [EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED]:
        "Compte de service mise à jour demandée",
    [EventCode.MEMBER_SERVICE_ACCOUNT_UPDATED]: "Compte de service mis à jour",
    [EventCode.MEMBER_SERVICE_TEAM_CREATED]: "Equipe sentry créée",
    [EventCode.MEMBER_SERVICE_TEAM_CREATION_REQUESTED]:
        "Equipe sentry demandée",
    [EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_FAILED_USER_DOES_NOT_EXIST]:
        "Mise à jour du compte sentry échouée. L'utilisateur n'existe pas.",
    [EventCode.MEMBER_CREATED]: "Membre créé",
    [EventCode.MEMBER_VALIDATED]: "Membre validé",
};

export const SYSTEM_NAME = "system";

export interface BaseActionEvent {
    action_on_username?: string;
    created_by_username: string;
    action_code: EventCode;
}

export interface ActionEvent {
    action_code: EventCode;
    action_on_username: string | undefined;
    created_by_username: string;
}

export const EventMemberRedirectionCreatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_REDIRECTION_CREATED),
    action_metadata: z.object({
        value: z.string().email(),
    }),
});

export const EventMemberRedirectionDeletedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_REDIRECTION_DELETED),
    action_metadata: z.object({
        value: z.string().email(),
    }),
});

export const EventMemberEmailCreatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_EMAIL_CREATED),
    action_metadata: z.object({
        value: z.string().email(),
    }),
});

export const EventMemberEmailDeletedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_EMAIL_DELETED),
});

export const EventMemberEmailExpiredPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_EMAIL_EXPIRED),
});

export const EventMemberPasswordUpdatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_PASSWORD_UPDATED),
});

export const EventMemberResponderCreatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_RESPONDER_CREATED),
    action_metadata: z.object({
        value: z.string(),
    }),
});

export const EventMemberResponderUpdatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_RESPONDER_UPDATED),
    action_metadata: z.object({
        value: z.string(),
        old_value: z.string(),
    }),
});

export const EventMemberResponderDeletedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_RESPONDER_DELETED),
});

export const EventMemberMarrainageAcceptedPayload = z.object({
    action_code: z.literal(EventCode.MARRAINAGE_ACCEPTED),
});

export const EventMemberMarrainageCreatedPayload = z.object({
    action_code: z.literal(EventCode.MARRAINAGE_CREATED),
});

export const EventMemberMarrainageDeclinedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_MARRAINAGE_DECLINED),
});

export const EventMemberVerificationWaitingSentPayload = z.object({
    action_code: z.literal(EventCode.EMAIL_VERIFICATION_WAITING_SENT),
});

export const EventMemberSecondaryEmailUpdatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_SECONDARY_EMAIL_UPDATED),
    action_metadata: z.object({
        value: z.string().email(),
        old_value: z.string().email().optional(),
    }),
});

export const EventMemberPrimaryEmailUpdatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_PRIMARY_EMAIL_UPDATED),
    action_metadata: z.object({
        value: z.string().email(),
        old_value: z.string().email().optional(),
    }),
});

export const EventMemberEndDatePayload = z.object({
    action_code: z.literal(EventCode.MEMBER_END_DATE_UPDATED),
    action_metadata: z.object({
        value: z.string(),
        old_value: z.string(),
    }),
});

export const EventMemberCommunicationEmailUpdatePayload = z.object({
    action_code: z.literal(EventCode.MEMBER_COMMUNICATION_EMAIL_UPDATE),
    action_metadata: z.object({
        value: z.nativeEnum(CommunicationEmailCode),
        old_value: z.nativeEnum(CommunicationEmailCode).optional(),
    }),
});

export const EventMemberEmailRecreatedUpdatPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_EMAIL_RECREATED),
    action_metadata: z.object({
        value: z.string(),
    }),
});

export const EventMemberEmailUpgradedUpdatePayload = z.object({
    action_code: z.literal(EventCode.MEMBER_EMAIL_UPGRADED),
});

export const EventMemberBaseInfoUpdatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_BASE_INFO_UPDATED),
    action_metadata: z.object({
        value: z.union([
            memberInfoUpdateSchema.shape.member,
            memberValidateInfoSchema,
        ]),
        old_value: z.union([
            memberInfoUpdateSchema.shape.member,
            memberValidateInfoSchema,
        ]),
    }),
});

export const EventStartupPhaseUpdatedPayload = z.object({
    action_code: z.literal(EventCode.STARTUP_PHASE_UPDATED),
});

export const EventStartupInfoUpdatedPayload = z.object({
    action_code: z.literal(EventCode.STARTUP_INFO_UPDATED),
    action_on_startup: z.string(),
    action_metadata: z
        .object({
            value: z.object({
                startup: startupInfoUpdateSchema.shape.startup,
                startupEvents: startupInfoUpdateSchema.shape.startupEvents,
                startupPhases: startupInfoUpdateSchema.shape.startupPhases,
                startupSponsorIds: z.array(z.string()),
            }),
            old_value: z.object({
                startup: startupInfoUpdateSchema.shape.startup,
                startupEvents: startupInfoUpdateSchema.shape.startupEvents,
                startupPhases: startupInfoUpdateSchema.shape.startupPhases,
                startupSponsorIds: z.array(z.string()),
            }),
        })
        .optional(),
});

export const EventStartupInfoCreatedPayload = z.object({
    action_code: z.literal(EventCode.STARTUP_INFO_CREATED),
    action_on_startup: z.string(),
    action_metadata: z
        .object({
            value: z.object({
                startup: startupInfoUpdateSchema.shape.startup,
                startupEvents: startupInfoUpdateSchema.shape.startupEvents,
                startupPhases: startupInfoUpdateSchema.shape.startupPhases,
                startupSponsorIds: z.array(z.string()),
            }),
        })
        .optional(),
});

export const EventMemberUnblockEmailPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_UNBLOCK_EMAIL),
    action_metadata: z.object({
        email: z.string(),
    }),
});

export const EventOrganizationCreatedPayload = z.object({
    action_code: z.literal(EventCode.ORGANIZATION_CREATED),
    action_metadata: z.object({
        value: z.object({
            name: z.string(),
            acronym: z.string().optional().nullable(),
            ghid: z.string().optional().nullable(),
            domaine_ministeriel: z.string(),
            type: z.string(),
        }),
    }),
});

export const EventTeamCreatedPayload = z.object({
    action_code: z.literal(EventCode.TEAM_CREATED),
    action_metadata: z.object({
        value: z.object({
            uuid: z.string(),
            ghid: z.string().nullable(),
            name: z.string(),
            mission: z.string().nullable(),
            incubator_id: z.string(),
            memberIds: z.array(z.string()),
        }),
    }),
});

export const EventOrganizationUpdatedPayload = z.object({
    action_code: z.literal(EventCode.ORGANIZATION_UPDATED),
    action_metadata: z.object({
        value: z.object({
            name: z.string(),
            acronym: z.string().optional().nullable(),
            ghid: z.string().optional().nullable(),
            domaine_ministeriel: z.string(),
            type: z.string(),
        }),
        old_value: z.object({
            name: z.string(),
            acronym: z.string().optional().nullable(),
            ghid: z.string().optional().nullable(),
            domaine_ministeriel: z.string(),
            type: z.string(),
        }),
    }),
});

export const EventTeamUpdatedPayload = z.object({
    action_code: z.literal(EventCode.TEAM_UPDATED),
    action_metadata: z.object({
        value: z.object({
            uuid: z.string(),
            ghid: z.string().nullable(),
            name: z.string(),
            mission: z.string().nullable(),
            incubator_id: z.string(),
            memberIds: z.array(z.string()),
        }),
        old_value: z.object({
            uuid: z.string(),
            ghid: z.string().nullable(),
            name: z.string(),
            mission: z.string().nullable(),
            incubator_id: z.string(),
            memberIds: z.array(z.string()),
        }),
    }),
});

export const EventMemberCreatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_CREATED),
    action_metadata: z.object({
        member: createMemberSchema._def.schema.shape.member,
        missions: createMemberSchema._def.schema.shape.missions,
        incubator_id: createMemberSchema._def.schema.shape.incubator_id
            .optional()
            .nullable(),
    }),
});

export const EventMemberValidatedPayload = z.object({
    action_code: z.literal(EventCode.MEMBER_VALIDATED),
});

export type EventPayloads =
    | z.infer<typeof EventMemberCommunicationEmailUpdatePayload>
    | z.infer<typeof EventMemberBaseInfoUpdatedPayload>
    | z.infer<typeof EventMemberMarrainageDeclinedPayload>
    | z.infer<typeof EventMemberMarrainageCreatedPayload>
    | z.infer<typeof EventMemberMarrainageAcceptedPayload>
    | z.infer<typeof EventMemberVerificationWaitingSentPayload>
    | z.infer<typeof EventMemberRedirectionCreatedPayload>
    | z.infer<typeof EventMemberResponderDeletedPayload>
    | z.infer<typeof EventMemberResponderCreatedPayload>
    | z.infer<typeof EventMemberResponderUpdatedPayload>
    | z.infer<typeof EventMemberCommunicationEmailUpdatePayload>
    | z.infer<typeof EventStartupInfoCreatedPayload>
    | z.infer<typeof EventStartupInfoUpdatedPayload>
    | z.infer<typeof EventMemberEmailRecreatedUpdatPayload>
    | z.infer<typeof EventMemberEmailCreatedPayload>
    | z.infer<typeof EventMemberEmailUpgradedUpdatePayload>
    | z.infer<typeof EventMemberPasswordUpdatedPayload>
    | z.infer<typeof EventMemberEndDatePayload>
    | z.infer<typeof EventMemberSecondaryEmailUpdatedPayload>
    | z.infer<typeof EventMemberPrimaryEmailUpdatedPayload>
    | z.infer<typeof EventMemberRedirectionDeletedPayload>
    | z.infer<typeof EventTeamCreatedPayload>
    | z.infer<typeof EventTeamUpdatedPayload>
    | z.infer<typeof EventMemberEmailDeletedPayload>
    | z.infer<typeof EventMemberUnblockEmailPayload>
    | z.infer<typeof EventOrganizationCreatedPayload>
    | z.infer<typeof EventOrganizationUpdatedPayload>
    | z.infer<typeof EventServiceAccountDeletedPayload>
    | z.infer<typeof EventMemberEmailExpiredPayload>
    | z.infer<typeof EventSentryAccountRequestedPayload>
    | z.infer<typeof EventSentryAccountCreatedPayload>
    | z.infer<typeof EventSentryAccountUpdateRequestedPayload>
    | z.infer<typeof EventSentryAccountUpdatedPayload>
    | z.infer<typeof EventSentryCreateTeamPayload>
    | z.infer<typeof EventSentryCreateTeamRequestedTeamPayload>
    | z.infer<typeof EventSentryAccountUpdateFailedUserDoesNotExistPayload>
    | z.infer<typeof EventMatomoAccountPayloadSchema>
    | z.infer<typeof EventMemberCreatedPayload>
    | z.infer<typeof EventMemberValidatedPayload>;

export type EventAction = BaseActionEvent & EventPayloads;

export type EventActionFromDB = EventAction & {
    created_at: Date;
    id: string;
};

export interface BaseEventAction<T extends EventCode> {
    action_on_username?: string;
    created_by_username: string;
    action_code: T;
    action_metadata: EventActionMetadata<T>;
    action_on_startup?: string;
}

// Assuming ActionMetadata is also dependent on T
type EventActionMetadata<T> =
    T extends EventCode.EMAIL_VERIFICATION_WAITING_SENT
        ? { value: string; old_value: string }
        : T extends EventCode.MARRAINAGE_ACCEPTED
        ? { value: string; old_value: string }
        : never;
