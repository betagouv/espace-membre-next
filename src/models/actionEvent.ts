import { z } from "zod";

import { CommunicationEmailCode, EmailStatusCode } from "./dbUser";
import { memberSchema } from "./member";
import { GithubStartupChangeSchema } from "@/server/controllers/helpers/githubHelpers/githubEntryInterface";

export enum EventCode {
    MEMBER_REDIRECTION_CREATED = "MEMBER_REDIRECTION_CREATED",
    MEMBER_REDIRECTION_DELETED = "MEMBER_REDIRECTION_DELETED",
    MEMBER_EMAIL_CREATED = "MEMBER_EMAIL_CREATED",
    MEMBER_EMAIL_DELETED = "MEMBER_EMAIL_DELETED",
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
    STARTUP_PHASE_UPDATED = "STARTUP_PHASE_UPDATED",
    STARTUP_INFO_UPDATED = "STARTUP_INFO_UPDATED",
    STARTUP_INFO_CREATED = "STARTUP_INFO_CREATED",
    EMAIL_VERIFICATION_WAITING_SENT = "EMAIL_VERIFICATION_WAITING_SENT",
}

interface ActionMetadata {
    old_value?: any;
    value?: any;
}

// export type EventParam = {
//     action_on_username?: string;
//     created_by_username: string;
//     action_metadata?: ActionMetadata;
// };

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
    [EventCode.STARTUP_PHASE_UPDATED]: "Phase de startup mis à jour",
    [EventCode.STARTUP_INFO_UPDATED]: "Info de startup mis à jour",
    [EventCode.STARTUP_INFO_CREATED]: "Fiche de startup crée",
    [EventCode.EMAIL_VERIFICATION_WAITING_SENT]:
        "Email de fiche à vérifier envoyé",
};

export interface BaseActionEvent {
    action_on_username?: string;
    created_by_username: string;
    action_code: EventCode;
}

export interface ActionEvent {
    action_code: EventCode;
    // action_metadata?: ActionMetadata;
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
        value: memberSchema,
        old_value: memberSchema.optional(),
    }),
});

export const EventStartupPhaseUpdatedPayload = z.object({
    action_code: z.literal(EventCode.STARTUP_PHASE_UPDATED),
});

export const EventStartupInfoUpdatedPayload = z.object({
    action_code: z.literal(EventCode.STARTUP_INFO_UPDATED),
    action_metadata: z.object({
        value: GithubStartupChangeSchema,
    }),
});

export const EventStartupInfoCreatedPayload = z.object({
    action_code: z.literal(EventCode.STARTUP_INFO_CREATED),
    action_metadata: z.object({
        value: GithubStartupChangeSchema,
    }),
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
    | z.infer<typeof EventMemberEmailDeletedPayload>;

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
}

// Assuming ActionMetadata is also dependent on T
type EventActionMetadata<T> =
    T extends EventCode.EMAIL_VERIFICATION_WAITING_SENT
        ? { value: string; old_value: string }
        : T extends EventCode.MARRAINAGE_ACCEPTED
        ? { value: string; old_value: string }
        : never;
