import { z } from "zod";

import {
  derniereDateFin,
  premiereDateVenue,
  SEGUR_DEMANDE_TYPE,
  SEGUR_DUREE_MAXIMUM_MOIS,
  SEGUR_JOURS,
  SEGUR_PERIODE,
  SEGUR_STATUT,
} from "../segur";

type SegurRequestData = {
  dateDebut?: string;
  dateFin?: string;
  nbParticipants?: number;
  autresMembres?: { prenomNom?: string; email?: string }[];
  datesReunion?: { date?: string }[];
  heureDebut?: string;
  heureFin?: string;
};

// Demande d'accès : une venue se demande au moins 48 h à l'avance et ne couvre
// pas plus de trois mois.
const verifierAcces = (data: SegurRequestData, ctx: z.RefinementCtx) => {
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
};

// Demande de salle de réunion : une ou plusieurs dates, un créneau commun, et
// les personnes attendues.
const verifierSalleReunion = (data: SegurRequestData, ctx: z.RefinementCtx) => {
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
};

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
    // Demande d'accès : dates de début/fin de venue, au format "YYYY-MM-DD".
    // Les contraintes de délai et de durée sont dans verifierAcces.
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
    // Demande de salle de réunion : nombre total de participants, demandeur
    // inclus. Laissé vide, il est déduit du nombre de personnes nommées.
    // Le formulaire transforme un champ vidé en undefined (setValueAs), pour que
    // z.coerce n'en fasse pas un 0 qui ferait échouer le min(1) pendant la
    // frappe. Ici on ne voit donc qu'un nombre ou rien.
    nbParticipants: z.coerce
      .number({ invalid_type_error: "Indique un nombre" })
      .int("Indique un nombre entier")
      .min(1, "Il y a au moins une personne")
      .max(200, "Nombre trop élevé")
      .optional(),
    // Autres personnes présentes à la réunion (nombre illimité).
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
    // Une ou plusieurs dates, avec le même créneau horaire, et le matériel
    // nécessaire.
    datesReunion: z.array(z.object({ date: z.string().optional() })).optional(),
    heureDebut: z.string().optional(),
    heureFin: z.string().optional(),
    materiel: z.string().optional(),
    precisions: z.string().optional(),
    statut: z.nativeEnum(SEGUR_STATUT).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.typeDemande === SEGUR_DEMANDE_TYPE.ACCES) {
      verifierAcces(data, ctx);
    } else if (data.typeDemande === SEGUR_DEMANDE_TYPE.SALLE_REUNION) {
      verifierSalleReunion(data, ctx);
    }
  });

export type segurRequestSchemaType = z.infer<typeof segurRequestSchema>;
