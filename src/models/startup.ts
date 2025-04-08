import { z } from "zod";

import { missionSchemaShape } from "./mission";

interface Relationship {
    incubator: {
        data: {
            type: string;
            id: string;
        };
    };
}

// todo: extract types from single "phases" array ?

export const PHASE_READABLE_NAME = {
    acceleration: "Accélération",
    investigation: "Investigation",
    transfer: "En cours de pérennisation",
    construction: "Construction",
    alumni: "Partenariat terminé",
    success: "Pérennisé",
};

export enum StartupPhase {
    PHASE_INVESTIGATION = "investigation",
    PHASE_CONSTRUCTION = "construction",
    PHASE_ACCELERATION = "acceleration",
    PHASE_TRANSFER = "transfer",
    PHASE_SUCCESS = "success",
    PHASE_ALUMNI = "alumni",
}

export const ACTIVE_PHASES = [
    StartupPhase.PHASE_ACCELERATION,
    StartupPhase.PHASE_CONSTRUCTION,
    StartupPhase.PHASE_INVESTIGATION,
];

export const PHASES_ORDERED_LIST = [
    StartupPhase.PHASE_INVESTIGATION,
    StartupPhase.PHASE_CONSTRUCTION,
    StartupPhase.PHASE_ACCELERATION,
    StartupPhase.PHASE_TRANSFER,
    StartupPhase.PHASE_SUCCESS,
    StartupPhase.PHASE_ALUMNI,
];

export enum AccessibilityStatus {
    NON_CONFORME = "non conforme",
    PARTIELLEMENT_CONFORME = "partiellement conforme",
    TOTALEMENT_CONFORME = "totalement conforme",
}

export enum StartupEvent {
    EVENT_LAUNCH = "product_launch",
    EVENT_COMITE = "committee",
    EVENT_FAST = "fast",
    EVENT_NATIONAL_IMPACT = "national_impact",
    EVENT_OTHER = "other",
    EVENT_END = "end",
}

export const EVENT_READABLE_NAME = {
    product_launch: "Lancement du produit",
    committee: "Passage en comité",
    fast: "FAST",
    national_impact: "Impact national validé",
    other: "Autre",
    end: "Abandon",
};

export const EVENTS_ORDERED_LIST = [
    StartupEvent.EVENT_LAUNCH,
    StartupEvent.EVENT_COMITE,
    StartupEvent.EVENT_FAST,
    StartupEvent.EVENT_NATIONAL_IMPACT,
    StartupEvent.EVENT_OTHER,
    StartupEvent.EVENT_END,
];

export const DSFR_STATUSES = [
    "Le DSFR est implémenté",
    "Le DSFR est implémenté partiellement",
    "Refonte prévue",
    "Service non soumis au DSFR",
] as const;
// export interface Startup {
//     github?: string;
//     website?: string;
//     dashlord_url?: string;
//     id: string;
//     name: string;
//     repository: string;
//     contact: string;
//     expired_members: string[];
//     active_members: string[];
//     previous_members: string[];
//     phases: Phase[];
// }

// // we keep this interface just for the migration
// export interface StartupInfo {
//     id: string;
//     attributes: {
//         sponsors: string[];
//         github: string;
//         dashlord_url: string;
//         website: any;
//         name: string;
//         repository: string;
//         contact: string;
//         expired_members: string[];
//         active_members: string[];
//         previous_members: string[];
//         pitch: string;
//         stats_url: string;
//         stats: boolean;
//         link: string;
//         incubator: string;
//         phases: {
//             start: string;
//             end?: string;
//             name: StartupPhase;
//         }[];
//         accessibility_status?: AccessibilityStatus;
//         analyse_risques_url?: string;
//         analyse_risques?: boolean;
//         content_url_encoded_markdown: string;
//         budget_url?: string;
//     };
//     relationships: Relationship;
// }

export const phaseSchema = z.object({
    uuid: z.string(),
    name: z.nativeEnum(StartupPhase),
    start: z.preprocess(
        (val) => {
            if (typeof val === "string") {
                return new Date(val);
            }
            return val;
        },
        z
            .date({
                errorMap: (issue, ctx) => ({
                    message: "Champ obligatoire",
                }),
            })
            .describe("Date de début de la phase")
    ),
    startup_id: z.string(),
    end: z
        .preprocess((val) => {
            if (typeof val === "string") {
                return new Date(val);
            }
            return val;
        }, z.date().describe("Date de fin de la phase").optional())
        .nullable(),
    comment: z.string().optional().nullable(),
});

export type phaseSchemaType = z.infer<typeof phaseSchema>;

export const eventSchema = z.object({
    uuid: z.string(),
    name: z.nativeEnum(StartupEvent),
    date: z.preprocess(
        (val) => {
            if (typeof val === "string") {
                return new Date(val);
            }
            return val;
        },
        z
            .date({
                errorMap: (issue, ctx) => ({
                    message: "Champ obligatoire",
                }),
            })
            .describe("Date")
    ),
    startup_id: z.string(),
    comment: z.string().optional().nullable(),
});

export type eventSchemaType = z.infer<typeof eventSchema>;

export const startupSchema = z.object({
    uuid: z.string(),
    ghid: z.string(),
    name: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le nom est obligatoire",
            }),
        })
        .min(1)
        .describe("Nom du produit"),
    pitch: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "L'objectif du produit est obligatoire",
            }),
        })
        .min(1)
        .describe("Objectif du produit"),
    sponsors: z.array(z.string()).optional(),
    incubator_id: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "L'incubateur est obligatoire",
            }),
        })
        .min(1)
        .describe("Incubateur ou fabrique numérique"),
    contact: z
        .string({
            errorMap: () => ({
                message: "Un email de contact est obligatoire",
            }),
        })
        .email()
        .min(1)
        .describe("Email de contact du produit"),
    link: z
        .string()
        .describe("URL du site web")
        .url({
            message:
                "L'URL fournie doit respecter le format suivant : https://exemple.com",
        })
        .or(z.literal(""))
        .optional()
        .nullable(),
    repository: z
        .string()
        .describe("URL du repository pour le code source")
        .optional()
        .nullable(),
    accessibility_status: z.string().optional().nullable(),
    dashlord_url: z
        .string()
        .describe("URL du rapport DashLord")
        .optional()
        .nullable(),
    stats_url: z
        .string()
        .describe("URL de la page de statistiques d'usage")
        .optional()
        .nullable(),
    budget_url: z
        .string()
        .describe("URL de la page de budget")
        .optional()
        .nullable(),
    mon_service_securise: z
        .boolean()
        .describe(
            "L'équipe a mené une démarche de sécurité sur MonServiceSécurisé"
        )
        .optional()
        .nullable(),
    analyse_risques: z
        .boolean()
        .describe("Nous avons réalisé une analyse de risque")
        .optional()
        .nullable(),
    analyse_risques_url: z
        .string()
        .describe("URL de l'analyse de risque")
        .optional()
        .nullable(),
    // events: z
    //     .array(eventSchema.omit({ uuid: true }))
    //     .optional()
    //     .nullable(),
    // phases: z
    //     .array(phaseSchema)
    //     .min(1, "Vous devez définir au moins une phase (ex: investigation)")
    //     .optional()
    //     .nullable(),
    techno: z.array(z.string()).optional().nullable(),
    mailing_list: z.string().optional().nullable(),
    usertypes: z
        .array(z.string())
        .optional()
        .describe("Utilisateurs cibles du service")
        .nullable(),
    //redirect_from: z.array(z.string()).optional(),
    fast: z.object({ promotion: z.number(), montant: z.number() }).optional(),
    thematiques: z
        .array(z.string())
        .optional()
        .describe("Thématiques addressées par la startup")
        .nullable(),
    description: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "La description doit faire minimum 30 caractères",
            }),
        })
        .min(30)
        .describe("Décrivez votre produit, son public, ses objectifs"),
    has_mobile_app: z
        .boolean()
        .describe("Le produit propose une application mobile")
        .optional()
        .nullable(),
    is_private_url: z
        .boolean()
        .describe(
            "L'application n'est pas accessible au public (accès restreint)"
        )
        .optional()
        .nullable(),
    dsfr_status: z
        .union([z.enum(DSFR_STATUSES), z.string()])
        .describe("Implémentation du design systeme de l'état")
        .optional(),
    tech_audit_url: z
        .string()
        .describe("URL de l'audit technique")
        .optional()
        .nullable(),
    roadmap_url: z
        .string()
        .describe("URL de la roadmap ou tickets")
        .optional()
        .nullable(),
    ecodesign_url: z
        .string()
        .describe("URL de la déclaration d'écoconception")
        .optional()
        .nullable(),
    impact_url: z
        .string()
        .describe("URL de la page de statistiques d'impact")
        .optional()
        .nullable(),
});

export type startupSchemaType = z.infer<typeof startupSchema>;

/*
 * when getting only the startup of a specific users we get an object
 * witch is a mix of missions and startups object with the minimal
 * information about users
 * */

export const userStartupSchema = z.object({
    uuid: startupSchema.shape.uuid,
    ghid: startupSchema.shape.ghid,
    name: startupSchema.shape.name,
    end: missionSchemaShape.end,
    start: missionSchemaShape.start,
    incubator_id: startupSchema.shape.incubator_id,
});

export type userStartupSchemaType = z.infer<typeof userStartupSchema>;
