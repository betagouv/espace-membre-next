import { z } from "zod";

import {
  SEGUR_JOURS,
  SEGUR_PERIODE,
  SEGUR_SALLE_REUNION,
  SEGUR_STATUT,
} from "../segur";

export const segurRequestSchema = z.object({
  prenomNom: z
    .string({ required_error: "Ton prénom et nom sont requis" })
    .min(1, "Ton prénom et nom sont requis"),
  email: z
    .string({ required_error: "Ton adresse mail est requise" })
    .email("Email invalide"),
  startupName: z
    .string({ required_error: "Le nom de ta startup est requis" })
    .min(1, "Le nom de ta startup est requis"),
  // Autres membres de l'équipe venant avec le demandeur (nombre illimité).
  autresMembres: z
    .array(
      z.object({
        prenomNom: z.string().optional(),
        email: z.string().email("Email invalide").or(z.literal("")).optional(),
      }),
    )
    .optional(),
  dateDebut: z
    .string({ required_error: "La date souhaitée de venue est requise" })
    .min(1, "La date souhaitée de venue est requise"),
  dateFin: z
    .string({ required_error: "La date de fin de la venue est requise" })
    .min(1, "La date de fin de la venue est requise"),
  precisions: z.string().optional(),
  // Radios optionnels : un choix non coché arrive en null — nullish() accepte
  // null/undefined pour que le champ reste facultatif. L'action traite null
  // comme vide (?? "").
  salleReunion: z.nativeEnum(SEGUR_SALLE_REUNION).nullish(),
  joursRecurrents: z
    .array(z.enum(SEGUR_JOURS as [string, ...string[]]))
    .optional(),
  periodeRecurrente: z.nativeEnum(SEGUR_PERIODE).nullish(),
  engagement: z.boolean().optional(),
  statut: z.nativeEnum(SEGUR_STATUT).optional(),
});

export type segurRequestSchemaType = z.infer<typeof segurRequestSchema>;
