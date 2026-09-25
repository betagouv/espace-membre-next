import { z } from "zod";

import {
  FORMATION_AUDIENCES,
  FORMATION_DUREES,
  FORMATION_FREQUENCE,
  FORMATION_JOURS,
  FORMATION_MODALITE,
  FORMATION_THEMATIQUES,
  MAX_FORMATION_INTERVALLE,
  MAX_FORMATION_OCCURRENCES,
} from "@/models/formationsGrist";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Formats d'illustration acceptés, en liste blanche plutôt qu'en `image/*`.
 *
 * `image/*` laissait passer le SVG, qui n'est pas une image inerte mais un
 * document scriptable. Le type est annoncé par le navigateur, donc un envoi
 * forgé peut mentir : cette liste ferme le chemin honnête et dit au membre ce
 * qu'on attend de lui. Ce qui verrouille pour de bon, c'est la route de service
 * qui rend les pièces jointes en téléchargement.
 */
export const TYPES_IMAGE_ACCEPTES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Récupère le fichier, qu'il arrive en File ou en FileList.
 *
 * Un champ fichier passé à react-hook-form rend une FileList : la validation
 * tourne donc sur une FileList côté navigateur, et sur un File côté serveur.
 * `FileList` n'existe pas sous Node, d'où le test par la forme plutôt que par
 * le type.
 */
export const getImageFile = (value: unknown): File | undefined => {
  if (value instanceof File) return value;
  if (
    value &&
    typeof value === "object" &&
    "length" in value &&
    (value as FileList)[0] instanceof File
  ) {
    return (value as FileList)[0];
  }
  return undefined;
};

// `url()` accepte tout ce que `new URL()` sait lire, `javascript:` compris.
// Le lien d'un e-learning devient un bouton sur la fiche : sans cette
// restriction, un lien déposé par un membre exécuterait du script chez qui
// clique, à commencer par l'équipe d'animation venue modérer.
const optionalUrl = z
  .string()
  .trim()
  .url("Lien invalide, il doit commencer par https://")
  .regex(/^https?:\/\//i, "Lien invalide, il doit commencer par https://")
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
    // Une session est créée avec la formation, à cette date. Facultative ici
    // parce qu'un e-learning n'en a pas : la règle est dans le superRefine.
    dateDebut: z.string().trim().optional(),
    lienVisioAdmin: optionalUrl,
    duree: z.enum(
      FORMATION_DUREES.map((d) => d.label) as [string, ...string[]],
      {
        errorMap: () => ({ message: "La durée est requise" }),
      },
    ),
    // Champ vidé -> undefined côté formulaire (setValueAs), jamais "".
    // Facultative : sans limite, tout le monde est inscrit et la liste
    // d'attente ne se déclenche jamais.
    capacite: z.coerce
      .number({ invalid_type_error: "Indique un nombre de places" })
      .int("Indique un nombre entier")
      .min(1, "Au moins une place")
      .max(500, "Nombre trop élevé")
      .optional(),
    // Pour un e-learning, c'est l'adresse où suivre la formation : les
    // e-learning repris de l'existant l'ont déjà dans cette colonne.
    lienSupport: optionalUrl,
    lienFeedback: optionalUrl,
    animateur: z
      .string({ required_error: "Le nom de l'animateur·ice est requis" })
      .trim()
      .min(1, "Le nom de l'animateur·ice est requis"),
    emailOrganisateur: z
      .string({ required_error: "L'email de l'organisateur·trice est requis" })
      .trim()
      .email("Email invalide"),
    // Le type File n'existe pas dans zod : présence, type et taille sont
    // validés dans le superRefine ci-dessous.
    image: z.any(),
    // Illustration choisie dans la banque du document, plutôt qu'envoyée.
    // C'est l'identifiant d'une pièce jointe déjà présente : rien à téléverser.
    imageId: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    requireVisioWhenRemote(data, ctx);
    requireLienWhenELearning(data, ctx);

    // Un e-learning est ouvert en continu : pas de date, donc pas de session.
    // Toute autre formation naît avec sa première date.
    if (
      data.modalite !== FORMATION_MODALITE.E_LEARNING &&
      !data.dateDebut?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateDebut"],
        message: "La date est requise",
      });
    }

    const image = getImageFile(data.image);
    // Une illustration choisie dans la banque dispense d'en envoyer une.
    if (data.imageId) return;
    if (!image || image.size === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["image"],
        message: "Choisis une illustration ou envoie la tienne",
      });
      return;
    }
    if (!TYPES_IMAGE_ACCEPTES.includes(image.type.toLowerCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["image"],
        message: "L'image doit être au format JPG, PNG, WEBP ou GIF",
      });
    }
    if (image.size > MAX_IMAGE_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["image"],
        message: "L'image ne doit pas dépasser 5 Mo",
      });
    }
  });

export type formationProposalSchemaType = z.infer<
  typeof formationProposalSchema
>;

/**
 * Le lien de visioconférence n'a de sens qu'à distance, mais il y devient
 * indispensable : sans lui, personne ne sait où se connecter.
 */
const requireVisioWhenRemote = (
  data: { modalite?: FORMATION_MODALITE; lienVisioAdmin?: string },
  ctx: z.RefinementCtx,
) => {
  if (
    data.modalite === FORMATION_MODALITE.DISTANCIEL &&
    !data.lienVisioAdmin?.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["lienVisioAdmin"],
      message: "Le lien de visioconférence est requis en distanciel",
    });
  }
};

/**
 * Un e-learning n'a ni date ni salle : son lien est le seul moyen d'y
 * accéder, sans lui la fiche ne mène nulle part.
 */
const requireLienWhenELearning = (
  data: { modalite?: FORMATION_MODALITE; lienSupport?: string },
  ctx: z.RefinementCtx,
) => {
  if (
    data.modalite === FORMATION_MODALITE.E_LEARNING &&
    !data.lienSupport?.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["lienSupport"],
      message: "Le lien de la formation est requis pour un e-learning",
    });
  }
};

/**
 * Modification d'une formation existante. Reprend les champs du dépôt, sans
 * l'image ni les dates : la session se gère à part, et remplacer l'illustration
 * demande un nouvel envoi de fichier.
 */
export const formationUpdateSchema = formationProposalSchema
  .innerType()
  .omit({ image: true, imageId: true, dateDebut: true })
  .extend({
    formationId: z.string().min(1),
  })
  // `innerType()` laisse les refinements du schéma de dépôt derrière lui : les
  // règles de lien doivent être rappelées ici, sinon elles ne
  // s'appliqueraient qu'à la création.
  .superRefine((data, ctx) => {
    requireVisioWhenRemote(data, ctx);
    requireLienWhenELearning(data, ctx);
  });

export type formationUpdateSchemaType = z.infer<typeof formationUpdateSchema>;

/**
 * Programmation de dates pour une formation existante.
 *
 * Sert aussi bien à dupliquer une formation à une autre date qu'à en poser une
 * série : une occurrence unique n'est qu'un cas particulier de récurrence.
 */
export const formationScheduleSchema = z
  .object({
    formationId: z.string().min(1),
    dateDebut: z
      .string({ required_error: "La date est requise" })
      .trim()
      .min(1, "La date est requise"),
    duree: z.enum(
      FORMATION_DUREES.map((d) => d.label) as [string, ...string[]],
      {
        errorMap: () => ({ message: "La durée est requise" }),
      },
    ),
    capacite: z.coerce
      .number({ invalid_type_error: "Indique un nombre de places" })
      .int("Indique un nombre entier")
      .min(1, "Au moins une place")
      .max(500, "Nombre trop élevé")
      .optional(),
    lienVisioAdmin: optionalUrl,
    frequence: z.nativeEnum(FORMATION_FREQUENCE, {
      errorMap: () => ({ message: "Le rythme est requis" }),
    }),
    intervalle: z.coerce
      .number({ invalid_type_error: "Indique un nombre" })
      .int("Indique un nombre entier")
      .min(1, "Au moins 1")
      .max(MAX_FORMATION_INTERVALLE, `${MAX_FORMATION_INTERVALLE} au maximum`),
    // Champ vide : la série garde le jour de la date de départ.
    jour: z
      .enum(FORMATION_JOURS.map((j) => j.value) as [string, ...string[]])
      .or(z.literal(""))
      .optional(),
    occurrences: z.coerce
      .number({ invalid_type_error: "Indique un nombre de dates" })
      .int("Indique un nombre entier")
      .min(1, "Au moins une date")
      .max(
        MAX_FORMATION_OCCURRENCES,
        `${MAX_FORMATION_OCCURRENCES} dates au maximum`,
      ),
  })
  .superRefine((data, ctx) => {
    // Une série d'une seule date n'est pas une série : c'est probablement le
    // rythme qui a été oublié.
    if (data.frequence !== FORMATION_FREQUENCE.AUCUNE && data.occurrences < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["occurrences"],
        message: "Au moins deux dates pour une formation qui se répète",
      });
    }
  });

export type formationScheduleSchemaType = z.infer<
  typeof formationScheduleSchema
>;

/**
 * Modification d'une date précise.
 *
 * Distincte de la modification de la formation : le sujet, la description ou
 * l'animateur·ice valent pour toutes les dates, alors que l'horaire, la durée,
 * la capacité et le lien de visioconférence appartiennent à une date seule.
 */
export const formationSessionUpdateSchema = z.object({
  sessionId: z.string().min(1),
  dateDebut: z
    .string({ required_error: "La date est requise" })
    .trim()
    .min(1, "La date est requise"),
  duree: z.enum(FORMATION_DUREES.map((d) => d.label) as [string, ...string[]], {
    errorMap: () => ({ message: "La durée est requise" }),
  }),
  capacite: z.coerce
    .number({ invalid_type_error: "Indique un nombre de places" })
    .int("Indique un nombre entier")
    .min(1, "Au moins une place")
    .max(500, "Nombre trop élevé")
    .optional(),
  lienVisioAdmin: optionalUrl,
});

export type formationSessionUpdateSchemaType = z.infer<
  typeof formationSessionUpdateSchema
>;
