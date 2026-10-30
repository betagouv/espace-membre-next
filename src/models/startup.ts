import { z } from "zod";

import { MAX_RELATED_IDS, MAX_TAGS } from "@/models/arrayLimits";

import { missionSchemaShape } from "./mission";

// todo: extract types from single "phases" array ?

export enum StartupPhase {
  PHASE_INVESTIGATION = "investigation",
  PHASE_CONSTRUCTION = "construction",
  PHASE_ACCELERATION = "acceleration",
  PHASE_ABANDON = "abandon",
  PHASE_ABANDON_INVESTIGATION = "abandon-investigation",
  PHASE_CONSOLIDATION = "consolidation",
  PHASE_OPERE = "opere",
  PHASE_TRANSFERE = "transfere",
}

export const PHASE_READABLE_NAME: Record<StartupPhase, string> = {
  investigation: "En investigation",
  acceleration: "En accélération",
  construction: "En construction",
  consolidation: "En consolidation",
  transfere: "Transféré",
  opere: "Opéré au sein du réseau",
  abandon: "Arrêté",
  "abandon-investigation": "Investigation non concluante",
};

export const PHASES_ORDERED_LIST = [
  StartupPhase.PHASE_INVESTIGATION,
  StartupPhase.PHASE_CONSTRUCTION,
  StartupPhase.PHASE_ACCELERATION,
  StartupPhase.PHASE_CONSOLIDATION,
  StartupPhase.PHASE_OPERE,
  StartupPhase.PHASE_TRANSFERE,
  StartupPhase.PHASE_ABANDON_INVESTIGATION,
  StartupPhase.PHASE_ABANDON,
];

export enum AccessibilityStatus {
  NON_CONFORME = "non conforme",
  PARTIELLEMENT_CONFORME = "partiellement conforme",
  TOTALEMENT_CONFORME = "totalement conforme",
}

export enum StartupEvent {
  EVENT_LAUNCH = "product_launch",
  EVENT_COMITE = "committee",
  EVENT_FAST = "fast",
  EVENT_NATIONAL_IMPACT = "national_impact",
  EVENT_OTHER = "other",
  EVENT_EIG = "eig",
  EVENT_END = "end",
}

export const EVENT_READABLE_NAME = {
  product_launch: "Lancement du produit",
  committee: "Passage en comité",
  eig: "EIG",
  fast: "FAST",
  national_impact: "Impact national validé",
  other: "Autre",
  end: "Abandon",
};

export const EVENTS_ORDERED_LIST = Object.values(StartupEvent);

export const DSFR_STATUSES = [
  "Le DSFR est implémenté",
  "Le DSFR est implémenté partiellement",
  "Refonte prévue",
  "Service non soumis au DSFR",
] as const;
export const phaseSchema = z.object({
  uuid: z.string(),
  name: z.nativeEnum(StartupPhase),
  start: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    },
    z
      .date({
        error: "Champ obligatoire",
      })
      .describe("Date de début de la phase"),
  ),
  startup_id: z.string(),
  end: z
    .preprocess((val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    }, z.date().describe("Date de fin de la phase").optional())
    .nullable(),
  comment: z.string().optional().nullable(),
});

export type phaseSchemaType = z.infer<typeof phaseSchema>;

export const eventSchema = z.object({
  uuid: z.string(),
  name: z.nativeEnum(StartupEvent),
  date: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        return new Date(val);
      }
      return val;
    },
    z
      .date({
        error: "Champ obligatoire",
      })
      .describe("Date"),
  ),
  startup_id: z.string(),
  comment: z.string().optional().nullable(),
});

export type eventSchemaType = z.infer<typeof eventSchema>;

export const startupSchema = z.object({
  uuid: z.string(),
  ghid: z.string(),
  name: z
    .string({
      error: "Le nom est obligatoire",
    })
    .min(1)
    .describe("Nom du produit"),
  pitch: z
    .string({
      error: "L'objectif du produit est obligatoire",
    })
    .min(1)
    .describe("Objectif du produit"),
  sponsors: z.array(z.string()).max(MAX_RELATED_IDS).optional(),
  // FIXME: la notion d'incubateur "principal" n'a pas de sens métier (rien
  // n'établit qu'un incubateur prime sur un autre pour une startup co-incubée).
  // Elle n'existe que pour ne pas casser les consommateurs de l'API protégée,
  // qui n'est pas versionnée. La source de vérité est incubator_ids (table
  // startups_incubators) ; incubator_id en est une projection dérivée côté
  // serveur et contrainte par la FK startups_principal_incubator_linked.
  // À supprimer dès que les dépendants se seront adaptés.
  incubator_id: z
    .string({
      error: "L'incubateur est obligatoire",
    })
    .min(1)
    .describe("Incubateur principal ou fabrique numérique"),
  incubator_ids: z
    .array(z.string().uuid())
    .max(MAX_RELATED_IDS)
    .optional()
    .describe("Incubateurs"),
  contact_dinum: z
    .preprocess(
      (val) => (val === "" ? null : val),
      z.string().uuid().nullable().optional(),
    )
    .describe("Point de contact DINUM"),
  contact_incubator: z
    .preprocess(
      (val) => (val === "" ? null : val),
      z.string().uuid().nullable().optional(),
    )
    .describe("Point de contact Incubateur"),
  contact: z
    .string({
      error: "Un email de contact est obligatoire",
    })
    .email()
    .min(1)
    .describe("Email de contact du produit"),
  link: z
    .string()
    .url({
      message:
        "L'URL fournie doit respecter le format suivant : https://exemple.com",
    })
    .or(z.literal(""))
    .optional()
    .nullable()
    .describe("URL du site web"),
  repository: z
    .string()
    .optional()
    .nullable()
    .describe("URL du repository pour le code source"),
  accessibility_status: z.string().optional().nullable(),
  dashlord_url: z
    .string()
    .optional()
    .nullable()
    .describe("URL du rapport DashLord"),
  stats_url: z
    .string()
    .optional()
    .nullable()
    .describe("URL de la page de statistiques d'usage"),
  budget_url: z
    .string()
    .optional()
    .nullable()
    .describe("URL de la page de budget"),
  mon_service_securise: z
    .boolean()
    .optional()
    .nullable()
    .describe(
      "L'équipe a mené une démarche de sécurité sur MonServiceSécurisé",
    ),
  analyse_risques: z
    .boolean()
    .optional()
    .nullable()
    .describe("Nous avons réalisé une analyse de risque"),
  analyse_risques_url: z
    .string()
    .optional()
    .nullable()
    .describe("URL de l'analyse de risque"),
  techno: z.array(z.string()).max(MAX_TAGS).optional().nullable(),
  mailing_list: z.string().optional().nullable(),
  usertypes: z
    .array(z.string())
    .max(MAX_TAGS)
    .optional()
    .nullable()
    .describe("Utilisateurs cibles du service"),
  //redirect_from: z.array(z.string()).optional(),
  fast: z.object({ promotion: z.number(), montant: z.number() }).optional(),
  thematiques: z
    .array(z.string())
    .max(MAX_TAGS)
    .optional()
    .nullable()
    .describe("Thématiques addressées par la startup"),
  description: z
    .string({
      error: "La description doit faire minimum 30 caractères",
    })
    .min(30)
    .describe("Décrivez votre produit, son public, ses objectifs"),
  has_mobile_app: z
    .boolean()
    .optional()
    .nullable()
    .describe("Le produit propose une application mobile"),
  is_private_url: z
    .boolean()
    .optional()
    .nullable()
    .describe("L'application n'est pas accessible au public (accès restreint)"),
  dsfr_status: z
    .union([z.enum(DSFR_STATUSES), z.string()])
    .optional()
    .describe("Implémentation du design systeme de l'état"),
  tech_audit_url: z
    .string()
    .optional()
    .nullable()
    .describe("URL de l'audit technique"),
  roadmap_url: z
    .string()
    .optional()
    .nullable()
    .describe("URL de la roadmap ou tickets"),
  ecodesign_url: z
    .string()
    .optional()
    .nullable()
    .describe("URL de la déclaration d'écoconception"),
  impact_url: z
    .string()
    .optional()
    .nullable()
    .describe("URL de la matrice d'impact"),
});

export type startupSchemaType = z.infer<typeof startupSchema>;

/*
 * when getting only the startup of a specific users we get an object
 * witch is a mix of missions and startups object with the minimal
 * information about users
 * */

export const userStartupSchema = z.object({
  uuid: startupSchema.shape.uuid,
  ghid: startupSchema.shape.ghid,
  name: startupSchema.shape.name,
  end: missionSchemaShape.end,
  start: missionSchemaShape.start,
  incubator_id: startupSchema.shape.incubator_id,
});

export type userStartupSchemaType = z.infer<typeof userStartupSchema>;
