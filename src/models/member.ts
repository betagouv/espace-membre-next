import { z } from "zod";

import { EmailStatusCode, GenderCode } from "./dbUser";
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

const genderSchema = z.nativeEnum(
    GenderCode, // ??
    {
        errorMap: (issue, ctx) => ({
            message: "Le champs gender est obligatoire",
        }),
    }
);

export const memberSchema = z.object({
    fullname: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le nom est obligatoire",
            }),
        })
        .min(1)
        .readonly(),
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
    mission: missionSchema,
    domaine: domaineSchema,
});

// Extend createMemberSchema with a bio property
export const completeMemberSchema = createMemberSchema.extend({
    bio: bioSchema,
    link: linkSchema,
    github: githubSchema,
    gender: genderSchema,
    role: roleSchema,
});
