import { userStatusOptions } from "@/frontConfig";
import { z } from "zod";

// export type Status = "independant" | "admin" | "service";

export enum Status {
    "independent" = "independent",
    "admin" = "admin",
    "service" = "service",
}

export interface Mission {
    start: string;
    end: string;
    status: Status;
    employer: string;
    startups: string[];
}

export interface DBMission {
    id: number;
    startup: string;
    status: string;
    role?: string;
    employer: string;
    username: string;
    start: Date;
    end?: Date;
}

export interface GithubMission {
    start: Date;
    end: Date;
    status: Status;
    employer: string;
    startups?: string[];
}

export const MissionSchema = z.object({
    start: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Champ obligatoire",
            }),
        })
        .describe("Date de début de la mission"),
    end: z.string().describe("Date de début de la mission").optional(),
    status: z
        .nativeEnum(
            Status, // force status options
            {
                errorMap: (issue, ctx) => ({
                    message: "Le statut est requis",
                }),
            }
        )
        .describe("Type de contrat"),
    employer: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Précisez un employeur",
            }),
        })
        .describe("Entité avec qui vous avez contractualisé")
        .min(3),
    startups: z.array(z.string()).optional(),
});
