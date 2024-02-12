import { z } from "zod";

import { EMAIL_PLAN_TYPE, OvhRedirection, OvhResponder } from "@/models/ovh";
import { EmailStatusCode } from "./dbUser";
import { Mission, MissionSchema } from "./mission";

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

export const DOMAINE_OPTIONS = [
    {
        key: "ANIMATION",
        name: "Animation",
    },
    {
        key: "COACHING",
        name: "Coaching",
    },
    {
        key: "DEPLOIEMENT",
        name: "Déploiement",
    },
    {
        key: "DESIGN",
        name: "Design",
    },
    {
        key: "DEVELOPPEMENT",
        name: "Développement",
    },
    {
        key: "INTRAPRENARIAT",
        name: "Intraprenariat",
    },
    {
        key: "PRODUIT",
        name: "Produit",
    },
    {
        key: "AUTRE",
        name: "Autre",
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

export const memberSchema = z.object({
    fullname: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le nom est obligatoire",
            }),
        })
        .describe("Nom complet")
        .min(1)
        .readonly(),
    role: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le rôle est un champ obligatoire",
            }),
        })
        .min(1)
        .describe("Rôle actuel, ex: UX designer"),
    link: z.union([
        z.literal(""),
        z.string().trim().url({ message: "URL invalide" }).optional(),
    ]),
    avatar: z.string().describe("URL ou slug de l'avatar").optional(),
    github: z.string().describe("Login GitHub").optional(),
    competences: z.array(z.string()).describe("Liste de compétences"),
    teams: z.array(z.string()).describe("Liste des équipes incubateurs"),
    missions: z
        .array(MissionSchema)
        .min(1, "Vous devez définir au moins une mission"),
    startups: z.array(z.string()).optional(),
    previously: z.array(z.string()),
    domaine: z.enum(
        DOMAINE_OPTIONS.map((domaine) => domaine.name), // ??
        {
            errorMap: (issue, ctx) => ({
                message: "Le domaine est un champ obligatoire",
            }),
        }
    ), // ??
    bio: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "La bio est obligatoire, be creative",
            }),
        })
        .min(15),
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
