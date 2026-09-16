import { z } from "zod";

import {
  SEGUR_DEMANDE_TYPE,
  SEGUR_JOURS,
  SEGUR_PERIODE,
  SEGUR_STATUT,
} from "../segur";

export const segurRequestSchema = z
  .object({
    typeDemande: z.nativeEnum(SEGUR_DEMANDE_TYPE, {
      required_error: "Précise le type de demande",
      invalid_type_error: "Précise le type de demande",
    }),
    prenomNom: z
      .string({ required_error: "Ton prénom et nom sont requis" })
      .min(1, "Ton prénom et nom sont requis"),
    email: z
      .string({ required_error: "Ton adresse mail est requise" })
      .email("Email invalide"),
    startupName: z
      .string({ required_error: "Le nom de ta startup est requis" })
      .min(1, "Le nom de ta startup est requis"),
    // Nombre total de participants, demandeur inclus. Laissé vide, il est
    // déduit du nombre de personnes nommées ci-dessous.
    // Le formulaire transforme un champ vidé en undefined (setValueAs), pour que
    // z.coerce n'en fasse pas un 0 qui ferait échouer le min(1) pendant la
    // frappe. Ici on ne voit donc qu'un nombre ou rien.
    nbParticipants: z.coerce
      .number({ invalid_type_error: "Indique un nombre" })
      .int("Indique un nombre entier")
      .min(1, "Il y a au moins une personne")
      .max(200, "Nombre trop élevé")
      .optional(),
    // Autres personnes venant avec le demandeur (nombre illimité).
    autresMembres: z
      .array(
        z.object({
          prenomNom: z.string().optional(),
          email: z
            .string()
            .email("Email invalide")
            .or(z.literal(""))
            .optional(),
        }),
      )
      .optional(),
    // Demande d'accès : dates de début/fin de venue. Requises uniquement pour
    // ce type de demande (voir superRefine).
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
    // Demande de salle de réunion : une ou plusieurs dates, avec le même
    // créneau horaire, et le matériel nécessaire.
    datesReunion: z.array(z.object({ date: z.string().optional() })).optional(),
    heureDebut: z.string().optional(),
    heureFin: z.string().optional(),
    materiel: z.string().optional(),
    precisions: z.string().optional(),
    statut: z.nativeEnum(SEGUR_STATUT).optional(),
  })
  .superRefine((data, ctx) => {
    // Le nombre saisi fait foi, mais il ne peut pas être inférieur au nombre de
    // personnes effectivement nommées.
    const nbNommes =
      1 +
      (data.autresMembres ?? []).filter(
        (m) => m?.prenomNom?.trim() || m?.email?.trim(),
      ).length;
    if (data.nbParticipants !== undefined && data.nbParticipants < nbNommes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nbParticipants"],
        message: `Tu as renseigné ${nbNommes} personnes, le nombre ne peut pas être inférieur`,
      });
    }

    if (data.typeDemande === SEGUR_DEMANDE_TYPE.ACCES) {
      if (!data.dateDebut?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dateDebut"],
          message: "La date souhaitée de venue est requise",
        });
      }
      if (!data.dateFin?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dateFin"],
          message: "La date de fin de la venue est requise",
        });
      }
      return;
    }

    if (data.typeDemande === SEGUR_DEMANDE_TYPE.SALLE_REUNION) {
      const dates = (data.datesReunion ?? []).filter((d) => d.date?.trim());
      if (!dates.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["datesReunion", 0, "date"],
          message: "Au moins une date de réunion est requise",
        });
      }
      if (!data.heureDebut?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["heureDebut"],
          message: "L'heure de début est requise",
        });
      }
      if (!data.heureFin?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["heureFin"],
          message: "L'heure de fin est requise",
        });
      } else if (
        data.heureDebut?.trim() &&
        data.heureFin.trim() <= data.heureDebut.trim()
      ) {
        // Les heures sont au format HH:mm : la comparaison de chaînes suffit.
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["heureFin"],
          message: "L'heure de fin doit être après l'heure de début",
        });
      }
    }
  });

export type segurRequestSchemaType = z.infer<typeof segurRequestSchema>;
