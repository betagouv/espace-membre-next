import { z } from "zod";

// export interface Formation {
//     id: string,
//     airtable_id: string,
//     name: string,
//     created_at: Date,
//     formation_date: Date,
//     formation_type: string,
//     formation_type_airtable_id: string,
//     is_embarquement: boolean
// }

export const formationSchema = z.object({
    id: z.string(),
    airtable_id: z.string(),
    description: z.string(),
    name: z.string(),
    imageUrl: z.string().optional(),
    created_at: z.date(),
    formation_date: z.date(),
    formation_type: z.string().optional(),
    formation_type_airtable_id: z.string().optional(),
    registeredMembers: z.array(z.string()).optional(),
    is_embarquement: z.boolean(),
    audience: z.array(z.string()).optional(),
    category: z.array(z.string()).optional(),
    start: z.date().optional(), // ou z.date() si vous voulez valider/converter en objet Date
    end: z.date().optional(),
    animatorEmail: z.string().optional(),
    animator: z.string().optional(),
    googleAgendaEvent: z.string().optional(),
    startDate: z.date().optional(),
    startTime: z.string().optional(),
    inscriptionLink: z.string(),
    availableSeats: z.number(),
    maxSeats: z.number().optional(),
});

export type Formation = z.infer<typeof formationSchema>;

export const formationInscriptionSchema = z.object({
    name: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le nom est obligatoire",
            }),
        })
        .describe("Nom complet")
        .min(1),
    email: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "L'email est un champ obligatoire",
            }),
        })
        .email()
        .describe("L'email"),
    formation: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "La formation est obligatoire",
            }),
        })
        .describe("La formation"),
});

export type FormationInscription = z.infer<typeof formationInscriptionSchema>;
