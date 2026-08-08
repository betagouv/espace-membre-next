import { EmailStatusCode } from "./member";

export interface Option {
  value: string;
  label: string;
}

export const EMAIL_STATUS_READABLE_FORMAT: Record<EmailStatusCode, string> = {
  [EmailStatusCode.EMAIL_ACTIVE]: "Actif",
  [EmailStatusCode.EMAIL_SUSPENDED]: "Suspendu",
  [EmailStatusCode.EMAIL_DELETED]: "Supprimé", // todo: remove
  [EmailStatusCode.EMAIL_CREATION_PENDING]: "Création en cours",
  [EmailStatusCode.EMAIL_UNSET]: "Non défini",
  [EmailStatusCode.EMAIL_VERIFICATION_WAITING]:
    "Le membre doit se connecter à l'espace-membre et vérifier ses informations avant que tu puisses lui créer un compte.",
  [EmailStatusCode.EMAIL_CREATION_WAITING]:
    "La création de l'email est en cours", // todo: remove > EMAIL_CREATION_PENDING
  [EmailStatusCode.MEMBER_VALIDATION_WAITING]:
    "En attente de la validation par un responsable transverse",
};

export interface FormErrorResponse {
  errors?: Record<string, string>;
  message: string;
}
