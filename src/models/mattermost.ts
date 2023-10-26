import { MattermostUser } from "@/lib/mattermost";
import { Member } from "./member";
import { DBUser } from "./dbUser/dbUser";

enum MattermostUserStatus {
    USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_GITUB_INFO = "USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_GITUB_INFO",
    USER_HAS_ACTIVE_PRIMARY_EMAIL = "USER_HAS_ACTIVE_PRIMARY_EMAIL",
    USER_IS_PARTNER_BUT_IS_EXPIRED = "USER_IS_PARTNER_BUT_IS_EXPIRED",
    USER_IS_NOT_VALID = "USER_IS_NOT_VALID",
    USER_HAS_PRIMARY_EMAIL_BUT_IS_EXPIRED = "USER_HAS_PRIMARY_EMAIL_BUT_IS_EXPIRED",
    USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO = "USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO",
    USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL = "USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL",
    USER_IS_VALID_WITH_DOMAIN = "USER_IS_VALID_WITH_DOMAIN",
    USER_IS_VALID_WITH_PARTNER = "USER_IS_VALID_WITH_PARTNER",
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_NO_GITUB_INFO = "USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_NO_GITUB_INFO",
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED = "USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED",
    USER_HAS_PRIMARY_EMAIL_BUT_IS_SUSPENDED = "USER_HAS_PRIMARY_EMAIL_BUT_IS_SUSPENDED",
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_SUSPENDED = "USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_SUSPENDED",
    USER_HAS_SUSPENDED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO = "USER_HAS_SUSPENDED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO"
}

const MATTERMOST_ACTIVE_STATUS = [
    MattermostUserStatus.USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL,
    MattermostUserStatus.USER_IS_VALID_WITH_DOMAIN,
    MattermostUserStatus.USER_IS_VALID_WITH_PARTNER
]

type MattermostUserWithStatus = MattermostUser & {
    status: MattermostUserStatus,
    memberInfo?: Member,
    dbUser?: DBUser
}

const MESSAGE_FOR_TYPE : Record<MattermostUserStatus, (user: MattermostUserWithStatus) => string> = {
    USER_IS_NOT_VALID: (user: MattermostUserWithStatus) => `Bonjour ${user.first_name},
        Tu reçois ce message car ton email n'a pas un domaine valide pour accèder à l'espace Communauté de mattermost.
        Les emails valides sont ceux en @beta.gouv.fr, d'etalab et des services publics en général ainsi que ceux des attributaires.
        
        - Si tu as ce genre d'email c'est celui-ci que tu dois utiliser comme email pour avoir accès a cet espace.
        - Si tu n'as pas ce genre d'email mais que tu fais toujours parti de la communauté (tu es dans une startup, tu travailles en transverse), il faut que tu crée une fiche membre sur https://espace-membre.incubateur.net/onboarding.
        
        Si tu n'es effectivement plus dans la communauté, ton compte mattermost sera ajouté à l'espace alumni et retiré de l'espace "Communauté" dans 1 semaine.
        
        Si tu as des questions ou que tu penses qu'il y a une erreur tu peux écrire à espace-membre@incubateur.net.
        
        Ceci est un message automatique envoyé par l'app Espace Membre.
    `,
    USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_GITUB_INFO: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_HAS_ACTIVE_PRIMARY_EMAIL: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_IS_PARTNER_BUT_IS_EXPIRED: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_HAS_PRIMARY_EMAIL_BUT_IS_EXPIRED: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin dépassée sur github.

Si c'est normal tu n'as rien a faire et ton compte mattermost sera ajouté à l'espace alumni et retiré de l'espace "Communauté" dans 1 semaine. 
Sinon il faudrait la mettre à jour : [ici](https://github.com/betagouv/beta.gouv.fr/edit/master/content/_authors/${user.memberInfo.id}.md)

Si tu n'y arrives pas un membre de ton équipe pourra sans doute t'aider.

Sinon n'hésite pas à poser tes questions sur Mattermost dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help) ou à répondre [par email à espace-membre@incubateur.net](mailto:espace-membre@incubateur.net).

Ceci est un message automatique envoyé par l'app Espace Membre.
    
`;
    },
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_SUSPENDED: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin à jour, mais l'email lié a ton compte mattermost semble supprimé.
Tu peux le recréer dans l'[espace membre](https://espace-membre.incubateur.net/) auquel tu peux te connecter avec ton adresse secondaire : ${user.dbUser.secondary_email}.
Dans Mon compte > Mon email.
Si tu as des questions tu peux les poser dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help). S'il y a une erreur tu peux écrire à espace-membre@incubateur.net.
        
Ceci est un message automatique envoyé par l'app Espace Membre
    `;
    },
    USER_HAS_EXPIRED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin à jour, mais l'email lié a ton compte mattermost semble supprimé.
Tu peux le recréer dans l'[espace membre](https://espace-membre.incubateur.net/account) sur la page Mon compte > Mon Email.
Tu peux te connecter à l'espace membre avec ton adresse secondaire : ${user.dbUser.secondary_email}.

Si tu as des questions tu peux les poser dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help). S'il y a une erreur tu peux écrire à espace-membre@incubateur.net.
        
Ceci est un message automatique envoyé par l'app Espace Membre
    `;
    },
    USER_HAS_SUSPENDED_PRIMARY_EMAIL_BUT_NO_EXPIRED_INFO: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin à jour, mais l'email lié a ton compte mattermost semble suspendu.
Tu peux le reactiver dans l'[espace membre](https://espace-membre.incubateur.net/) auquel tu peux te connecter avec ton adresse secondaire : ${user.dbUser.secondary_email}.
Il te suffit ensuite de mettre à jour ton mot de passe pour le réactiver : https://espace-membre.incubateur.net/account#password>

Si tu as des questions tu peux les poser dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help). S'il y a une erreur tu peux écrire à espace-membre@incubateur.net.
        
Ceci est un message automatique envoyé par l'app Espace Membre.
    `;
    },
    USER_IS_VALID_WITH_ACTIVE_PRIMARY_EMAIL: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_IS_VALID_WITH_DOMAIN: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_IS_VALID_WITH_PARTNER: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_NO_GITUB_INFO: function (user: MattermostUserWithStatus): string {
        throw new Error("Function not implemented.");
    },
    USER_HAS_ACTIVE_PRIMARY_EMAIL_BUT_IS_EXPIRED: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin dépassée sur github.

Si c'est normal tu n'as rien a faire et ton compte mattermost sera ajouté à l'espace alumni et retiré de l'espace "Communauté" dans 1 semaine. 
Sinon il faudrait la mettre à jour : [ici](https://github.com/betagouv/beta.gouv.fr/edit/master/content/_authors/${user.memberInfo.id}.md)
Et merger la pull request.

Si tu n'y arrives pas un membre de ton équipe pourra sans doute t'aider.

Sinon n'hésite pas à poser tes questions sur Mattermost dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help) ou à répondre [par email à espace-membre@incubateur.net](mailto:espace-membre@incubateur.net).

Ceci est un message automatique envoyé par l'app Espace Membre.
    
`;
    },
    USER_HAS_PRIMARY_EMAIL_BUT_IS_SUSPENDED: function (user: MattermostUserWithStatus): string {
        return `Bonjour ${user.first_name},
Tu reçois ce message car ta fiche membre beta.gouv.fr à une date de fin dépassée sur github.

Si c'est normal tu n'as rien a faire et ton compte mattermost sera ajouté à l'espace alumni et retiré de l'espace "Communauté" dans 1 mois. 
Sinon il faudrait la mettre à jour : [ici](https://github.com/betagouv/beta.gouv.fr/edit/master/content/_authors/${user.memberInfo.id}.md)
Et merger la pull request.

Si tu n'y arrives pas un membre de ton équipe pourra sans doute t'aider.

Sinon n'hésite pas à poser tes questions sur Mattermost dans [~incubateur-help](https://mattermost.incubateur.net/betagouv/channels/incubateur-help) ou à répondre [par email à espace-membre@incubateur.net](mailto:espace-membre@incubateur.net).

Ceci est un message automatique envoyé par l'app Espace Membre.
    
`;
    }
}