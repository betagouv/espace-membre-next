import { z } from "zod";

interface Relationship {
    incubator: {
        data: {
            type: string;
            id: string;
        };
    };
}

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

export interface Startup {
    github?: string;
    website?: string;
    dashlord_url?: string;
    id: string;
    name: string;
    repository: string;
    contact: string;
    expired_members: string[];
    active_members: string[];
    previous_members: string[];
    phases: Phase[];
}

export interface StartupInfo {
    id: string;
    attributes: {
        sponsors: string[];
        github: string;
        dashlord_url: string;
        website: any;
        name: string;
        repository: string;
        contact: string;
        expired_members: string[];
        active_members: string[];
        previous_members: string[];
        pitch: string;
        stats_url: string;
        link: string;
        incubator: string;
        phases: Phase[];
        accessibility_status?: AccessibilityStatus;
        analyse_risques_url?: string;
        analyse_risques?: boolean;
        content_url_encoded_markdown: string;
    };
    relationships: Relationship;
}

export interface StartupsAPIResponse {
    data: StartupInfo[];
}

export const phaseSchema = z.object({
    // @ts-ignore
    name: z.enum(Object.keys(PHASE_READABLE_NAME)),
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
    end: z.preprocess((val) => {
        if (typeof val === "string") {
            return new Date(val);
        }
        return val;
    }, z.date().describe("Date de début de la phase").optional()),
    comment: z.string().optional(),
});

export interface Phase extends z.infer<typeof phaseSchema> {}

export interface DBStartup {
    mailing_list?: string;
    id: string;
    name: string;
    pitch: string;
    stats_url: string;
    link: string;
    repository: string;
    contact: string;
    phases: Phase[];
    current_phase: StartupPhase;
    current_phase_date: Date;
    incubator: string;
}

export const startupSchema = z.object({
    id: z.string(),
    title: z.string(),
    mission: z.string(),
    sponsors: z.array(z.string()).optional(),
    incubator: z.string(),
    contact: z.string(),
    link: z.string().optional(),
    repository: z.string().optional(),
    accessibility_status: z.string().optional(),
    dashlord_url: z.string().optional(),
    stats: z.boolean().optional(),
    stats_url: z.string().optional(),
    budget_url: z.string().optional(),
    analyse_risques: z.boolean().optional(),
    analyse_risques_url: z.string().optional(),
    events: z.array(z.object({ name: z.string(), date: z.date() })).optional(),
    phases: z.array(phaseSchema).optional(),
    techno: z.array(z.string()).optional(),
    usertypes: z.array(z.string()).optional(),
    //redirect_from: z.array(z.string()).optional(),
    fast: z.object({ promotion: z.number(), montant: z.number() }).optional(),
});

export interface StartupFrontMatter extends z.infer<typeof startupSchema> {}
