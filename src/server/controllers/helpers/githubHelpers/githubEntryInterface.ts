import { z } from "zod";

import { memberSchemaType } from "@/models/member";
import { SponsorDomaineMinisteriel, SponsorType } from "@/models/sponsor";
import { AccessibilityStatus, phaseSchema } from "@/models/startup";

export interface GithubAuthorChange extends Omit<memberSchemaType, "bio"> {}

export interface GithubAuthorMissionChange
    extends Pick<memberSchemaType, "missions"> {}

export interface GithubFile {
    path: string;
    name: string;
}

export interface GithubAuthorFile extends GithubFile {
    changes: GithubAuthorChange;
    content?: string;
}

export interface GithubImageFile extends GithubFile {
    content: string;
}

export interface GithubStartupFile extends GithubFile {
    changes: GithubStartupChange;
    content: string;
}

export interface GithubSponsorFile extends GithubFile {
    changes: GithubSponsorChange;
}

export interface GithubSponsorChange {
    id: string; // slug
    name: string;
    acronym: string;
    domaine_ministeriel: SponsorDomaineMinisteriel;
    type: SponsorType;
}

export const GithubStartupChangeSchema = z.object({
    phases: z.array(phaseSchema).optional(), // Optional array of 'Phase'
    link: z.string(), // Required string
    title: z.string().optional(), // Optional string
    dashlord_url: z.string(), // Required string
    mission: z.string(), // Required string
    stats_url: z.string(), // Required string
    budget_url: z.string(), // Required string
    repository: z.string(), // Required string
    contact: z.string(), // Required string
    sponsors: z.tuple([z.string()]), // Tuple with one string element
    incubator: z.string(), // Required string
    accessibility_status: z.nativeEnum(AccessibilityStatus), // Use the defined 'AccessibilityStatus' schema
    analyse_risques_url: z.string(), // Required string
    analyse_risques: z.boolean(), // Required boolean
    mon_service_securise: z.boolean(), // Required boolean
    thematiques: z.array(z.string()).optional(),
    usertypes: z.array(z.string()).optional(),
});

export interface GithubStartupChange
    extends z.infer<typeof GithubStartupChangeSchema> {}
// {
//     phases?: Phase[];
//     link: string;
//     title?: string;
//     dashlord_url: string;
//     mission: string;
//     stats_url: string;
//     repository: string;
//     contact: string;
//     sponsors: [string];
//     incubator: string;
//     accessibility_status: AccessibilityStatus;
//     analyse_risques_url: string;
//     analyse_risques: boolean;
// }

export type GithubBetagouvFile =
    | GithubAuthorFile
    | GithubSponsorFile
    | GithubImageFile
    | GithubStartupFile;
