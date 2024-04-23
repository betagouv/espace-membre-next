import { Domaine } from "../member";
import { DBMission, createDBMission } from "../mission";

export enum USER_EVENT {
    USER_EMAIL_ACTIVATED = "USER_EMAIL_ACTIVATED",
    ADD_USER_TO_ONBOARDING_MAILING_LIST = "ADD_USER_TO_ONBOARDING_MAILING_LIST",
    USER_EMAIL_REDIRECTION_ACTIVATED = "USER_EMAIL_REDIRECTION_ACTIVATED",
}

export enum EmailStatusCode {
    EMAIL_ACTIVE = "EMAIL_ACTIVE",
    EMAIL_SUSPENDED = "EMAIL_SUSPENDED",
    EMAIL_DELETED = "EMAIL_DELETED",
    EMAIL_EXPIRED = "EMAIL_EXPIRED",
    EMAIL_CREATION_PENDING = "EMAIL_CREATION_PENDING", // email is being created in ovh
    EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING = "EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING",
    EMAIL_RECREATION_PENDING = "EMAIL_RECREATION_PENDING",
    EMAIL_UNSET = "EMAIL_UNSET",
    EMAIL_REDIRECTION_PENDING = "EMAIL_REDIRECTION_PENDING",
    EMAIL_REDIRECTION_ACTIVE = "EMAIL_REDIRECTION_ACTIVE",
    EMAIL_VERIFICATION_WAITING = "EMAIL_VERIFICATION_WAITING",
    EMAIL_CREATION_WAITING = "EMAIL_CREATION_WAITING", // email will be created
}

export enum GenderCode {
    NSP = "NSP",
    FEMALE = "female",
    MALE = "male",
    OTHER = "other",
}

export enum LegalStatus {
    AE = "AE",
    contractuel = "contractuel",
    EIRL = "EIRL",
    EURL = "EURL",
    fonctionnaire = "fonctionnaire",
    PORTAGE = "portage",
    asso = "asso",
    SA = "sa",
    SASU = "SASU",
    SNC = "SNC",
}

export enum CommunicationEmailCode {
    PRIMARY = "primary",
    SECONDARY = "secondary",
}

export enum MemberType {
    BETA = "beta",
    ATTRIBUTAIRE = "attributaire",
    DINUM = "dinum",
    OTHER = "autre",
}

export interface DBUserPublic {
    username: string;
    // id: string;
    fullname: string;
    github?: string;
    // email?: string;
    //todo remove missions
    // missions: Mission[];
    //startups: string[]; duplicate
    // info in missions
    // previously?: string[];
    // start: string;
    // end: string;
    // employer: string;
    domaine: Domaine; //duplicate
    role: string;
}

export interface DBUser extends DBUserPublic {
    uuid: string;
    secondary_email: string;
    primary_email?: string;
    member_type: MemberType;
    created_at: Date;
    primary_email_status: EmailStatusCode;
    primary_email_status_updated_at: Date;
    workplace_insee_code: string;
    tjm: number;
    domaine: Domaine;
    gender: GenderCode;
    legal_status: LegalStatus;
    communication_email: CommunicationEmailCode;
    osm_city: string;
    average_nb_of_days: number;
    startups: string[];
    email_is_redirection: boolean;
    email_verified: Date | null;
}

export interface DBUserPublicAndMission extends DBUserPublic {
    missions: DBMission[];
}

export interface DBUserAndMission extends DBUser {
    missions: DBMission[];
}

export interface createDBUserAndMission
    extends Omit<DBUser, "id" | "created_at" | "uuid"> {
    missions: createDBMission[];
}

export interface DBUserDetail {
    average_nb_of_days: number;
    hash: string;
    tjm: number;
    gender: GenderCode;
}

export interface DBUserWithEmailsAndMattermostUsername extends DBUser {
    mattermostUsername: string;
}

export const genderOptions = [
    {
        key: "female",
        name: "Féminin",
    },
    {
        key: "male",
        name: "Masculin",
    },
    {
        key: "other",
        name: "Autre",
    },
    {
        key: "NSP",
        name: "Ne se prononce pas",
    },
];

export const statusOptions = [
    {
        key: "AE",
        name: "Auto-entreprise/micro-entreprise",
    },
    {
        key: "contractuel",
        name: "Contractuel-elle",
    },
    {
        key: "EIRL",
        name: "Entreprise individuelle : EI ou EIRL",
    },
    {
        key: "EURL",
        name: "EURL",
    },
    {
        key: "fonctionnaire",
        name: "Fonctionnaire",
    },
    {
        key: "PORTAGE",
        name: "Portage salarial",
    },
    {
        key: "asso",
        name: "Salarié-e d'une coopérative (CAE, SCOP, Association)",
    },
    {
        key: "SA",
        name: "Salarié-e d'une entreprise (SA, SAS, SARL)",
    },
    {
        key: "SASU",
        name: "SASU",
    },
    {
        key: "SNC",
        name: "SNC",
    },
];
