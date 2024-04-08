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

export interface ActionEvent {
    action_code: EventCode;
    action_metadata: ActionMetadata | undefined;
    action_on_username: string | undefined;
    created_by_username: string;
}

export type EventParam = {
    action_on_username?: string;
    created_by_username: string;
    action_metadata?: ActionMetadata;
};

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
