import { z } from "zod";

import {
  FORMATION_AUDIENCES,
  FORMATION_DUREES,
  FORMATION_MODALITE,
  FORMATION_THEMATIQUES,
} from "@/models/formationsGrist";

const optionalUrl = z
  .string()
  .trim()
  .url("Lien invalide, il doit commencer par https://")
  .or(z.literal(""))
  .optional();

export const formationProposalSchema = z
  .object({
    titre: z
      .string({ required_error: "Le sujet est requis" })
      .trim()
      .min(1, "Le sujet est requis")
      .max(150, "150 caractères maximum"),
    description: z
      .string({ required_error: "La description est requise" })
      .trim()
      .min(1, "La description est requise"),
    modalite: z.nativeEnum(FORMATION_MODALITE, {
      errorMap: () => ({ message: "La modalité est requise" }),
    }),
    thematiques: z
      .array(z.enum(FORMATION_THEMATIQUES as [string, ...string[]]))
      .min(1, "Choisis au moins une catégorie"),
    audience: z
      .array(z.enum(FORMATION_AUDIENCES as [string, ...string[]]))
      .min(1, "Choisis au moins une audience"),
    // Si la date est déjà fixée : une session est créée avec la formation.
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    lienVisioAdmin: optionalUrl,
    duree: z
      .enum(FORMATION_DUREES.map((d) => d.label) as [string, ...string[]], {
        errorMap: () => ({ message: "Durée inconnue" }),
      })
      .optional(),
    // Champ vidé -> undefined côté formulaire (setValueAs), jamais "".
    capacite: z.coerce
      .number({ invalid_type_error: "Indique un nombre" })
      .int("Indique un nombre entier")
      .min(1, "Au moins une place")
      .max(500, "Nombre trop élevé")
      .optional(),
    lienSupport: optionalUrl,
    lienFeedback: optionalUrl,
    animateur: z
      .string({ required_error: "Le nom de l'animateur·ice est requis" })
      .trim()
      .min(1, "Le nom de l'animateur·ice est requis"),
    // L'identifiant Tchap technique (@prenom.nom-beta.gouv.fr:agent.dinum...)
    // est imbuvable a saisir : on demande l'adresse, qui suffit a retrouver la
    // personne et a la contacter.
    animateurTchap: z
      .string()
      .trim()
      .email("Adresse invalide")
      .or(z.literal(""))
      .optional(),
    emailOrganisateur: z
      .string({ required_error: "L'email de l'organisateur·trice est requis" })
      .trim()
      .email("Email invalide"),
    gestionInscriptions: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.dateFin && !data.dateDebut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateDebut"],
        message: "Indique aussi la date de début",
      });
    }
    if (
      data.dateDebut &&
      data.dateFin &&
      new Date(data.dateFin) <= new Date(data.dateDebut)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFin"],
        message: "La fin doit être après le début",
      });
    }
  });

export type formationProposalSchemaType = z.infer<
  typeof formationProposalSchema
>;
