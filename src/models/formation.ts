import { z } from "zod";

export const formationSchema = z.object({
  id: z.string(),
  airtable_id: z.string(),
  description: z.string(),
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
  // Adresse Tchap de l'animateur·ice : sa partie locale vaut le ghid, ce qui
  // permet de reconnaître la personne qui anime.
  animatorTchap: z.string().optional(),
  googleAgendaEvent: z.string().optional(),
  startDate: z.date().optional(),
  inscriptionLink: z.string(),
  availableSeats: z.number(),
  maxSeats: z.number().optional(),
  waitingListUsernames: z.array(z.string()).optional(),
  // Identifiant de la session Grist à venir, quand la formation en a une :
  // c'est à elle qu'on s'inscrit, pas au format.
  sessionId: z.string().optional(),
  // Champs de gestion, visibles seulement par l'animateur·ice et l'équipe
  // d'animation.
  statut: z.string().optional(),
  lienAdmin: z.string().optional(),
  lienSupport: z.string().optional(),
  lienFeedback: z.string().optional(),
  gestionInscriptions: z.boolean().optional(),
  duree: z.number().optional(),
  modalite: z.string().optional(),
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
