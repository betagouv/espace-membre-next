import { z } from "zod";

export const formationSchema = z.object({
  id: z.string(),
  airtable_id: z.string(),
  description: z.string(),
  name: z.string(),
  imageUrl: z.string().optional(),
  created_at: z.date(),
  formation_date: z.date().optional(),
  is_embarquement: z.boolean(),
  isELearning: z.boolean(),
  audience: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  start: z.date().optional(),
  animatorEmail: z.string().optional(),
  animator: z.string().optional(),
  // Adresse Tchap de l'animateur·ice : sa partie locale vaut le ghid, ce qui
  // permet de reconnaître la personne qui anime.
  animatorTchap: z.string().optional(),
  startDate: z.date().optional(),
  inscriptionLink: z.string(),
  availableSeats: z.number(),
  maxSeats: z.number().optional(),
  // Limite portée par le format lui-même, proposée aux prochaines dates.
  // Distincte de `maxSeats`, qui est celle de la date la plus proche.
  capaciteParDefaut: z.number().optional(),
  // Identifiant de la session Grist à venir, quand la formation en a une :
  // c'est à elle qu'on s'inscrit, pas au format.
  sessionId: z.string().optional(),
  // Toutes les dates à venir, la plus proche en tête. Une formation peut être
  // programmée plusieurs fois : chaque date a ses propres inscriptions.
  sessions: z
    .array(
      z.object({
        id: z.string(),
        start: z.date().optional(),
        maxSeats: z.number().optional(),
        availableSeats: z.number().optional(),
        // Propres à la date : chacune peut avoir sa durée et son lien.
        dureeHeures: z.number().optional(),
        lienVisioAdmin: z.string().optional(),
        // Inscriptions confirmées, hors liste d'attente. Seule façon d'annoncer
        // un décompte quand la date n'a pas de limite.
        inscrits: z.number().optional(),
      }),
    )
    .optional(),
  // Champs de gestion, visibles seulement par l'animateur·ice et l'équipe
  // d'animation.
  statut: z.string().optional(),
  lienAdmin: z.string().optional(),
  // Où se tient une formation en présentiel.
  adresse: z.string().optional(),
  lienSupport: z.string().optional(),
  lienFeedback: z.string().optional(),
  duree: z.number().optional(),
  modalite: z.string().optional(),
});

export type Formation = z.infer<typeof formationSchema>;
