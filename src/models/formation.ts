import { z } from "zod";

export const formationSchema = z.object({
  id: z.string(),
  airtable_id: z.string(),
  description: z.string().optional(),
  name: z.string(),
  imageUrl: z.string().optional(),
  created_at: z.date(),
  formation_date: z.date().optional(),
  formation_type: z.string().optional(),
  formation_type_airtable_id: z.string().optional(),
  registeredMembers: z.array(z.string()).optional(),
  is_embarquement: z.boolean(),
  isELearning: z.boolean(),
  audience: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  start: z.date().optional(),
  end: z.date().optional(),
  animatorEmail: z.string().optional(),
  animator: z.string().optional(),
  googleAgendaEvent: z.string().optional(),
  startDate: z.date().optional(),
  inscriptionLink: z.string(),
  availableSeats: z.number(),
  maxSeats: z.number().optional(),
  waitingListUsernames: z.array(z.string()).optional(),
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
  isInWaitingList: z.boolean(),
});

export type FormationInscription = z.infer<typeof formationInscriptionSchema>;
