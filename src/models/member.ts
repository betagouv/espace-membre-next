import { z } from "zod";

import { missionSchema } from "./mission";
import {
    EMAIL_PLAN_TYPE,
    OvhRedirectionSchema,
    OvhResponderSchema,
} from "@/models/ovh";

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

export enum Domaine {
    ANIMATION = "Animation",
    COACHING = "Coaching",
    DEPLOIEMENT = "Déploiement",
    DESIGN = "Design",
    DEVELOPPEMENT = "Développement",
    INTRAPRENARIAT = "Intraprenariat",
    PRODUIT = "Produit",
    AUTRE = "Autre",
    DATA = "Data",
}

type DomaineOption = {
    key: keyof typeof Domaine;
    name: Domaine;
};

export const DOMAINE_OPTIONS: DomaineOption[] = [
    {
        key: "ANIMATION",
        name: Domaine.ANIMATION,
    },
    {
        key: "COACHING",
        name: Domaine.COACHING,
    },
    {
        key: "DEPLOIEMENT",
        name: Domaine.DEPLOIEMENT,
    },
    {
        key: "DESIGN",
        name: Domaine.DESIGN,
    },
    {
        key: "DEVELOPPEMENT",
        name: Domaine.DEVELOPPEMENT,
    },
    {
        key: "INTRAPRENARIAT",
        name: Domaine.INTRAPRENARIAT,
    },
    {
        key: "PRODUIT",
        name: Domaine.PRODUIT,
    },
    {
        key: "AUTRE",
        name: Domaine.AUTRE,
    },
    {
        key: "DATA",
        name: Domaine.DATA,
    },
];

export const memberSchema = z.object({
    // modify info schema
    uuid: z.string({}).readonly(),
    username: z.string({}).readonly(),
    fullname: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le nom est obligatoire",
            }),
        })
        .min(1)
        .readonly()
        .describe("Nom complet"),
    role: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le rôle est un champ obligatoire",
            }),
        })
        .min(1)
        .describe("Rôle actuel"),
    link: z
        .union([
            z.null(),
            z.literal(""),
            z.string().trim().url({ message: "URL invalide" }).optional(),
        ])
        .describe("Adresse du profil LinkedIn ou site web"),
    avatar: z
        .string()
        .describe("URL ou slug de l'avatar")
        .nullable()
        .optional(),
    github: z.string().describe("Login GitHub").optional().nullable(),
    competences: z
        .array(z.string())
        .describe("Liste des compétences")
        .optional()
        .nullable(),
    teams: z
        .array(z.string())
        .describe("Liste des équipes incubateurs")
        .optional()
        .nullable(),
    missions: z
        .array(missionSchema)
        .min(0, "Vous devez définir au moins une mission"),
    startups: z.array(z.string()).optional().nullable(),
    previously: z.array(z.string()).optional().nullable(),
    domaine: z.nativeEnum(
        Domaine, // ??
        {
            errorMap: (issue, ctx) => ({
                message: "Le domaine est un champ obligatoire",
            }),
        }
    ), // ??
    bio: z
        .string({
            errorMap: (issue, ctx) => ({
                message:
                    "La bio est optionnelle mais elle permet d'en dire plus sur toi, be creative",
            }),
        })
        .describe("Courte bio")
        .optional()
        .nullable(),
    memberType: z.nativeEnum(MemberType).optional().nullable(),
    // email relative info
    secondary_email: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "L'email est obligatoire",
            }),
        })
        .email()
        .describe("Email"),
    isEmailBetaAsked: z.boolean().optional().nullable(),
    email_is_redirection: z.boolean().optional(),
    communication_email: z.nativeEnum(CommunicationEmailCode),
    // stat info
    gender: z
        .nativeEnum(
            GenderCode, // ??
            {
                errorMap: (issue, ctx) => ({
                    message: "Le champ gender est obligatoire",
                }),
            }
        )
        .optional()
        .nullable(),
    average_nb_of_days: z
        .number()
        .describe("Nombre de jour moyen travaillé")
        .min(1)
        .max(5)
        .nullable()
        .optional(),
    tjm: z.number().optional().nullable(),
    legal_status: z
        .nativeEnum(
            LegalStatus, // ??
            {
                errorMap: (issue, ctx) => ({
                    message: "Le status legal n'a pas une valeur correcte",
                }),
            }
        )
        .describe(`Status legal de l'entreprise`)
        .optional(),
    workplace_insee_code: z.string().describe("Ville").nullable().optional(),
    osm_city: z.string().describe("Ville international").nullable().optional(),
    primary_email: z.string().email().nullable(),
    primary_email_status: z.nativeEnum(EmailStatusCode).readonly(),
    primary_email_status_updated_at: z.date().readonly(),
    updated_at: z.date().readonly(),
});
export type memberSchemaType = z.infer<typeof memberSchema>;

export const EmailInfosSchema = z.object({
    email: z.string().email(), // Validation supplémentaire pour vérifier le format de l'email
    isBlocked: z.boolean(),
    emailPlan: z.nativeEnum(EMAIL_PLAN_TYPE),
    isPro: z.boolean().optional(),
    isExchange: z.boolean().optional(),
});
export type EmailInfos = z.infer<typeof EmailInfosSchema>;

export const memberWrapperSchema = z.object({
    userInfos: memberSchema,
    isExpired: z.boolean(),
    emailInfos: EmailInfosSchema.nullable(),
    emailRedirections: z.array(OvhRedirectionSchema),
    emailResponder: OvhResponderSchema.nullable(),
    authorizations: z.object({
        canCreateEmail: z.boolean(),
        canCreateRedirection: z.boolean(),
        canChangePassword: z.boolean(),
        canChangeEmails: z.boolean(),
        hasPublicServiceEmail: z.boolean(),
    }),
});

export type memberWrapperSchemaType = z.infer<typeof memberWrapperSchema>;

// member info that other member can get
export const memberBaseInfoSchema = memberSchema.pick({
    uuid: true,
    username: true,
    fullname: true,
    role: true,
    domaine: true,
    bio: true,
    link: true,
    github: true,
    missions: true,
    primary_email: true,
    primary_email_status: true,
    memberType: true,
    primary_email_status_updated_at: true,
    communication_email: true,
    secondary_email: true,
    email_is_redirection: true,
    updated_at: true,
    competences: true,
});

export type memberBaseInfoSchemaType = z.infer<typeof memberBaseInfoSchema>;

export const memberPublicInfoSchema = memberSchema.pick({
    uuid: true,
    username: true,
    fullname: true,
    role: true,
    domaine: true,
    bio: true,
    link: true,
    github: true,
    missions: true,
    competences: true,
    // primary_email: true,
    primary_email_status: true,
    // communication_email: true,
    // secondary_email: true,
});

export type memberPublicInfoSchemaType = z.infer<typeof memberPublicInfoSchema>;

export const memberWrapperPublicInfoSchema = z.object({
    userPublicInfos: memberPublicInfoSchema,
    isExpired: z.boolean(),
    isEmailBlocked: z.boolean(),
    hasEmailInfos: z.boolean(),
    mattermostInfo: z.object({
        hasMattermostAccount: z.boolean(),
        isInactiveOrNotInTeam: z.boolean(),
    }),
    hasSecondaryEmail: z.boolean(),
});

export type memberWrapperPublicInfoSchemaType = z.infer<
    typeof memberWrapperPublicInfoSchema
>;

const missionsArraySchema = z.array(missionSchema);

export type HasMissions<T = any> = T & {
    missions: z.infer<typeof missionsArraySchema>;
};

const memberBaseInfoAndMattermostWrapper = z.object({
    userInfos: memberBaseInfoSchema,
    mattermostUsername: z.string(),
});

export type memberBaseInfoAndMattermostWrapperType = z.infer<
    typeof memberBaseInfoAndMattermostWrapper
>;

// export interface MemberWithPrimaryEmailInfo extends Member {
//     primary_email: string;
//     primary_email_status: EmailStatusCode;
//     primary_email_status_updated_at: Date;
// }

// export interface MemberWithEmail extends Member {
//     email: string | undefined;
// }

// const memberStatInfoSchema = z.object({
//     gender: genderSchema,
//     average_nb_of_days: z
//         .number()
//         .describe("Nombre de jour moyen travaillé")
//         .min(1)
//         .max(5)
//         .nullable()
//         .optional(),
//     tjm: z.number().optional().nullable(),
//     legal_status: z
//         .nativeEnum(
//             LegalStatus, // ??
//             {
//                 errorMap: (issue, ctx) => ({
//                     message: "Le status legal n'a pas une valeur correcte",
//                 }),
//             }
//         )
//         .describe(`Status legal de l'entreprise`)
//         .optional(),
//     workplace_insee_code: z.string().describe("Ville").optional(),
//     osm_city: z.string().describe("Ville international").optional(),
// });

// Schema to update user infos without email relative info : Use in BaseInfoUpdate
// export const updateMemberSchema = memberSchema.merge(memberStatInfoSchema);
// export type updateMemberSchemaType = z.infer<typeof updateMemberSchema>;

// const memberEmailSchema = z.object({
//     secondary_email: emailSchema.optional(),
//     isEmailBetaAsked: z.boolean().optional().nullable(),
//     communication_email: z
//         .nativeEnum(CommunicationEmailCode)
//         .optional()
//         .nullable(),
// });

// export const completeMemberSchema = memberSchema
//     .merge(memberEmailSchema)
//     .merge(memberStatInfoSchema);
// export type completeMemberSchemaType = z.infer<typeof completeMemberSchema>;

// export const updateMemberSchema = memberSchema.merge(memberStatInfoSchema);
// export type updateMemberSchemaType = z.infer<typeof updateMemberSchema>;
