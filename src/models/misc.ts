import { EmailStatusCode } from "./member";

// export interface Option {
//     key: string;
//     name: string;
// }

export interface Option {
  value: string;
  label: string;
}

export const EMAIL_STATUS_READABLE_FORMAT: Record<EmailStatusCode, string> = {
  [EmailStatusCode.EMAIL_ACTIVE]: "Actif",
  [EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING]:
    "Actif : en attente de définition du mot de passe", // todo: remove
  [EmailStatusCode.EMAIL_REDIRECTION_ACTIVE]: `L'email est une redirection. Email attributaire`, // todo: remove
  [EmailStatusCode.EMAIL_SUSPENDED]: "Suspendu",
  [EmailStatusCode.EMAIL_DELETED]: "Supprimé", // todo: remove
  [EmailStatusCode.EMAIL_EXPIRED]: "Expiré", // todo: remove
  [EmailStatusCode.EMAIL_CREATION_PENDING]: "Création en cours",
  [EmailStatusCode.EMAIL_RECREATION_PENDING]: "Recréation en cours", // todo: remove
  [EmailStatusCode.EMAIL_UNSET]: "Non défini",
  [EmailStatusCode.EMAIL_REDIRECTION_PENDING]:
    "L'email est une redirection. La création est en cours", // todo: remove
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
