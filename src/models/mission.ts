import { z } from "zod";

import { Startups } from "@/@types/db";
import { userStatusOptions } from "@/frontConfig";

// export type Status = "independant" | "admin" | "service";

export enum Status {
    "independent" = "independent",
    "admin" = "admin",
    "service" = "service",
}

export interface Mission {
    start: Date;
    end?: Date | null;
    status: Status | null;
    employer: string;
    startups: string[];
}

export interface DBMission {
    id: number;
    uuid: string;
    // startup: string;
    status: Status;
    role?: string | null;
    employer?: string;
    username: string;
    start: Date;
    end?: Date;
    startups: Startups[];
}

export interface GithubMission {
    start: Date;
    end: Date;
    status: Status;
    employer: string;
    startups?: string[];
}

export const missionSchema = z.object({
    uuid: z.string().readonly().optional(),
    start: z
        .preprocess(
            (val) => {
                if (typeof val === "string") {
                    return new Date(val);
                }
                return val;
            },
            z.date({
                errorMap: (issue, ctx) => ({
                    message: "Champ obligatoire",
                }),
            })
        )
        .describe("Date de début de mission"),
    end: z
        .preprocess(
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

                .optional()
        )
        .describe("Date de fin de mission")
        .optional()
        .nullable(),
    status: z
        .enum(
            ["independent", "admin", "service"], // force status options
            {
                errorMap: (issue, ctx) => ({
                    message: "Le statut est requis",
                }),
            }
        )
        .describe("Type de contrat")
        .nullable(),
    employer: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Précisez un employeur",
            }),
        })
        .describe("Entité avec qui tu as contractualisé")
        .nullable(),
    startups: z.array(z.string()).optional(),
});

export type missionSchemaType = z.infer<typeof missionSchema>;

export interface createDBMission extends Omit<DBMission, "uuid" | "id"> {
    startups: Startups[];
    user_id: string;
}

export interface updateDBMission extends DBMission {
    startups: Startups[];
    user_id: string;
}
