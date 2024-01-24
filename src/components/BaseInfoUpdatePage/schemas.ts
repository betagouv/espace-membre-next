import { z } from "zod";

import { userStatusOptions } from "@/config";
import { DOMAINE_OPTIONS } from "@/models/member";

export const MissionSchema = z.object({
    start: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Champ obligatoire",
            }),
        })
        .describe("Date de début de la mission")
        .min(1),
    end: z.string().describe("Date de début de la mission").optional(),
    status: z
        .enum(
            userStatusOptions.map((status) => status.key), //?
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
    startups: z.array(z.string()),
});

export const MemberSchema = z.object({
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
    github: z.string().describe("Login GitHub").optional(),
    missions: z
        .array(MissionSchema)
        .min(1, "Vous devez définir au moins une mission"),
    startups: z.array(z.string()),
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
        .min(30),
});
