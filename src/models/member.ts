import { z } from "zod";

import {
    CommunicationEmailCode,
    EmailStatusCode,
    GenderCode,
    LegalStatus,
    MemberType,
} from "./dbUser";
import { Mission, missionSchema } from "./mission";
import { UsersDomaineEnum } from "@/@types/db";
import {
    EMAIL_PLAN_TYPE,
    OvhRedirection,
    OvhRedirectionSchema,
    OvhResponder,
    OvhResponderSchema,
} from "@/models/ovh";

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

export interface Member {
    id: string;
    fullname: string;
    github?: string;
    email?: string;
    missions: Mission[];
    startups: string[];
    previously?: string[];
    start: string;
    end: string;
    employer: string;
    domaine: UsersDomaineEnum;
    role: string;
    competences?: string[];
    memberType: MemberType;
}

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
    communication_email: z
        .nativeEnum(CommunicationEmailCode)
        .optional()
        .nullable(),
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
    communication_email: true,
    secondary_email: true,
});

export type memberBaseInfoSchemaType = z.infer<typeof memberBaseInfoSchema>;

export const memberPublicInfoSchema = memberSchema.pick({
    username: true,
    fullname: true,
    role: true,
    domaine: true,
    bio: true,
    link: true,
    github: true,
    missions: true,
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

export interface MemberWithPrimaryEmailInfo extends Member {
    primary_email: string;
    primary_email_status: EmailStatusCode;
    primary_email_status_updated_at: Date;
}

export interface MemberWithEmail extends Member {
    email: string | undefined;
}

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
