import { z } from "zod";

import {
    CommunicationEmailCode,
    EmailStatusCode,
    GenderCode,
    LegalStatus,
} from "./dbUser";
import { Mission, missionSchema } from "./mission";
import { EMAIL_PLAN_TYPE, OvhRedirection, OvhResponder } from "@/models/ovh";

export enum Domaine {
    ANIMATION = "Animation",
    COACHING = "Coaching",
    DEPLOIEMENT = "Déploiement",
    DESIGN = "Design",
    DEVELOPPEMENT = "Développement",
    INTRAPRENARIAT = "Intraprenariat",
    PRODUIT = "Produit",
    AUTRE = "Autre",
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
    domaine: Domaine;
    role: string;
}

const bioSchema = z
    .string({
        errorMap: (issue, ctx) => ({
            message:
                "La bio est optionnelle mais elle permet d'en dire plus sur toi, be creative",
        }),
    })
    .optional();

const emailSchema = z
    .string({
        errorMap: (issue, ctx) => ({
            message: "L'email est obligatoire",
        }),
    })
    .email()
    .describe("Email");

const githubSchema = z.string().describe("Login GitHub").optional();

const domaineSchema = z.nativeEnum(
    Domaine, // ??
    {
        errorMap: (issue, ctx) => ({
            message: "Le domaine est un champ obligatoire",
        }),
    }
);

const linkSchema = z.union([
    z.null(),
    z.literal(""),
    z.string().trim().url({ message: "URL invalide" }).optional(),
]);

const roleSchema = z
    .string({
        errorMap: (issue, ctx) => ({
            message: "Le rôle est un champ obligatoire",
        }),
    })
    .min(1)
    .describe("Rôle actuel, ex: UX designer");

const genderSchema = z
    .nativeEnum(
        GenderCode, // ??
        {
            errorMap: (issue, ctx) => ({
                message: "Le champ gender est obligatoire",
            }),
        }
    )
    .optional()
    .nullable();

export const memberSchema = z.object({
    fullname: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le nom est obligatoire",
            }),
        })
        .min(1)
        .readonly()
        .describe("Nom complet"),
    role: roleSchema,
    link: linkSchema,
    avatar: z
        .string()
        .describe("URL ou slug de l'avatar")
        .nullable()
        .optional(),
    github: githubSchema,
    competences: z
        .array(z.string())
        .describe("Liste des compétences")
        .optional(),
    teams: z
        .array(z.string())
        .describe("Liste des équipes incubateurs")
        .optional(),
    missions: z
        .array(missionSchema)
        .min(1, "Vous devez définir au moins une mission"),
    startups: z.array(z.string()).optional(),
    previously: z.array(z.string()).optional(),
    domaine: domaineSchema, // ??
    bio: bioSchema,
});

export type memberSchemaType = z.infer<typeof memberSchema>;
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

export interface MemberWithEmailsAndMattermostUsername extends Member {
    primary_email: string;
    secondary_email?: string;
    communication_email: string;
    mattermostUsername: string;
}

export interface EmailInfos {
    email: string;
    isBlocked: boolean;
    emailPlan: EMAIL_PLAN_TYPE;
    isPro?: boolean;
    isExchange?: boolean;
}

export interface MemberWithPermission {
    userInfos: Member;
    emailInfos: any;
    redirections: OvhRedirection[];
    canChangeEmails: boolean;
    isExpired: boolean;
    responder: OvhResponder;
    canCreateEmail;
    canCreateRedirection;
    canChangePassword;
}

export const createMemberSchema = z.object({
    firstname: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le prénom est obligatoire",
            }),
        })
        .describe("Prénom")
        .min(1),
    lastname: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le Nom est obligatoire",
            }),
        })
        .describe("Nom")
        .min(1),
    email: emailSchema,
    missions: z
        .array(missionSchema)
        .min(1, "Vous devez définir au moins une mission"),
    domaine: domaineSchema,
});

export type createMemberSchemaType = z.infer<typeof createMemberSchema>;

export const memberStatInfoSchema = z.object({
    gender: genderSchema,
    workplace_insee_code: z.string().describe("Ville").optional(),
    osm_city: z.string().describe("Ville international").optional(),
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
});

export const dbMemberSchema = z.object({
    username: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le nom est obligatoire",
            }),
        })
        .describe("Nom complet")
        .min(1)
        .readonly(),
    email: emailSchema,
    isEmailBetaAsked: z.boolean().optional().nullable(),
    communication_email: z
        .nativeEnum(CommunicationEmailCode)
        .optional()
        .nullable(),
});

export const completeMemberSchema = memberSchema
    .merge(dbMemberSchema)
    .merge(memberStatInfoSchema);
export type completeMemberSchemaType = z.infer<typeof completeMemberSchema>;
