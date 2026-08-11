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
  MEMBER_VERIFIED = "MEMBER_VERIFIED",
  MEMBER_USER_EVENTS_UPDATED = "MEMBER_UPDATE_USER_EVENTS",
  DIMAIL_MAILBOX_CREATED = "DIMAIL_MAILBOX_CREATED",
  INCUBATOR_CREATED = "INCUBATOR_CREATED",
  INCUBATOR_UPDATED = "INCUBATOR_UPDATED",
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
  [EventCode.MEMBER_SERVICE_TEAM_CREATION_REQUESTED]: "Equipe sentry demandée",
  [EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_FAILED_USER_DOES_NOT_EXIST]:
    "Mise à jour du compte sentry échouée. L'utilisateur n'existe pas.",
  [EventCode.MEMBER_CREATED]: "Membre créé",
  [EventCode.MEMBER_VALIDATED]: "Membre validé",
  [EventCode.MEMBER_VERIFIED]: "Membre vérifié",
  [EventCode.MEMBER_USER_EVENTS_UPDATED]: "Evénement du membre mis à jour",
  [EventCode.DIMAIL_MAILBOX_CREATED]: "Boite mail Dimail créée",
  [EventCode.INCUBATOR_CREATED]: "Incubateur créé",
  [EventCode.INCUBATOR_UPDATED]: "Incubateur mis à jour",
};

export const SYSTEM_NAME = "system";

// action_metadata has no fixed shape across event codes: most write a
// { value, old_value } pair, but a few (MEMBER_USER_EVENTS_UPDATED,
// MEMBER_UNBLOCK_EMAIL...) use their own bespoke fields. Callers that need
// to read a specific shape back out (e.g. validateNewMember.ts) should
// parse action_metadata with a small local zod schema of their own rather
// than relying on a type here.
export interface EventAction {
  action_code: EventCode;
  created_by_username: string;
  action_on_username?: string;
  action_on_startup?: string;
  action_metadata?: Record<string, unknown>;
}

export type EventActionFromDB = EventAction & {
  id: string;
  created_at: Date;
};
