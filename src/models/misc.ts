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
    EMAIL_ACTIVE: "Actif",
    EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING:
        "Actif : en attente de définition du mot de passe",
    EMAIL_REDIRECTION_ACTIVE: `L'email est une redirection. Email attributaire`,
    EMAIL_SUSPENDED: "Suspendu",
    EMAIL_DELETED: "Supprimé",
    EMAIL_EXPIRED: "Expiré",
    EMAIL_CREATION_PENDING: "Création en cours",
    EMAIL_RECREATION_PENDING: "Recréation en cours",
    EMAIL_UNSET: "Non défini",
    [EmailStatusCode.EMAIL_REDIRECTION_PENDING]:
        "L'email est une redirection. La création est en cours",
    [EmailStatusCode.EMAIL_VERIFICATION_WAITING]:
        "Le membre doit se connecter à l'espace-membre et vérifier ses informations avant que tu puisses lui créer un compte.",
    [EmailStatusCode.EMAIL_CREATION_WAITING]:
        "La création de l'email est en cours",
};

export interface FormErrorResponse {
    errors?: Record<string, string>;
    message: string;
}
