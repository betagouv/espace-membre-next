import { z } from "zod";

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
    acceleration: "En Accélération",
    investigation: "En Investigation",
    transfer: "Transférée",
    construction: "En Construction",
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
    // @ts-ignore
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
        .describe("Incubateur ou fabrique numérique"),
    contact: z
        .string({
            errorMap: () => ({
                message: "Un email de contact est obligatoire",
            }),
        })
        .min(1)
        .describe("Email de contact du produit"),
    link: z.string().describe("URL du site web").optional().nullable(),
    repository: z
        .string()
        .describe("URL du repository GitHub")
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
        .describe("URL de la page de statistiques")
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
        .describe("Url de l'analyse de risque")
        .optional()
        .nullable(),
    events: z
        .array(z.object({ name: z.string(), date: z.date() }))
        .optional()
        .nullable(),
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
});

export type startupSchemaType = z.infer<typeof startupSchema>;
