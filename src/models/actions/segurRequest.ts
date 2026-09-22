import { z } from "zod";

import {
  derniereDateFin,
  premiereDateVenue,
  SEGUR_DUREE_MAXIMUM_MOIS,
  SEGUR_JOURS,
  SEGUR_PERIODE,
  SEGUR_STATUT,
} from "../segur";

export const segurRequestSchema = z
  .object({
    prenomNom: z
      .string({ required_error: "Ton prénom et nom sont requis" })
      .min(1, "Ton prénom et nom sont requis"),
    email: z
      .string({ required_error: "Ton adresse mail est requise" })
      .email("Email invalide"),
    startupName: z
      .string({ required_error: "Le nom de ta startup est requis" })
      .min(1, "Le nom de ta startup est requis"),
    // Dates de début/fin de venue, au format "YYYY-MM-DD". Les contraintes de
    // délai et de durée sont dans le superRefine ci-dessous.
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    joursRecurrents: z
      .array(z.enum(SEGUR_JOURS as [string, ...string[]]))
      .optional(),
    // Radio optionnel : un choix non coché arrive en null — nullish() accepte
    // null/undefined pour que le champ reste facultatif. L'action traite null
    // comme vide (?? "").
    periodeRecurrente: z.nativeEnum(SEGUR_PERIODE).nullish(),
    engagement: z.boolean().optional(),
    precisions: z.string().optional(),
    statut: z.nativeEnum(SEGUR_STATUT).optional(),
  })
  .superRefine((data, ctx) => {
    const dateDebut = data.dateDebut?.trim();
    const dateFin = data.dateFin?.trim();

    if (!dateDebut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateDebut"],
        message: "La date souhaitée de venue est requise",
      });
    } else if (dateDebut < premiereDateVenue()) {
      // Le délai est aussi vérifié ici, et pas seulement via l'attribut `min`
      // du champ date : celui-ci est contournable, et l'action rejoue ce schéma
      // côté serveur.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateDebut"],
        message:
          "Une demande doit être déposée au moins 48 h avant la venue. Pour une venue plus proche, contacte Amel directement.",
      });
    }

    if (!dateFin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFin"],
        message: "La date de fin de la venue est requise",
      });
      return;
    }

    if (!dateDebut) {
      return;
    }

    if (dateFin < dateDebut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFin"],
        message: "La date de fin ne peut pas être avant la date de venue",
      });
      return;
    }

    const dateFinMaximum = derniereDateFin(dateDebut);
    if (dateFinMaximum && dateFin > dateFinMaximum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateFin"],
        message: `Une demande ne peut pas couvrir plus de ${SEGUR_DUREE_MAXIMUM_MOIS} mois`,
      });
    }
  });

export type segurRequestSchemaType = z.infer<typeof segurRequestSchema>;
