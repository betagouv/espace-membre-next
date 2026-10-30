import { z } from "zod";

import {
  MAX_MEMBER_MISSIONS,
  MAX_RELATED_IDS,
  MAX_TAGS,
} from "@/models/arrayLimits";

import { missionSchema } from "./mission";
import { teamSchema } from "./team";

export enum EMAIL_PLAN_TYPE {
  EMAIL_PLAN_OPI = "EMAIL_PLAN_OPI",
}

export const RedirectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  id: z.string(),
});
export type Redirection = z.infer<typeof RedirectionSchema>;

export enum USER_EVENT {
  USER_EMAIL_ACTIVATED = "USER_EMAIL_ACTIVATED",
  ADD_USER_TO_ONBOARDING_MAILING_LIST = "ADD_USER_TO_ONBOARDING_MAILING_LIST",
  USER_EMAIL_REDIRECTION_ACTIVATED = "USER_EMAIL_REDIRECTION_ACTIVATED",
}

export enum EmailStatusCode {
  EMAIL_ACTIVE = "EMAIL_ACTIVE",
  EMAIL_SUSPENDED = "EMAIL_SUSPENDED",
  EMAIL_DELETED = "EMAIL_DELETED",
  EMAIL_EXPIRED = "EMAIL_EXPIRED",
  EMAIL_CREATION_PENDING = "EMAIL_CREATION_PENDING", // email is being created
  EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING = "EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING",
  EMAIL_RECREATION_PENDING = "EMAIL_RECREATION_PENDING",
  EMAIL_UNSET = "EMAIL_UNSET",
  EMAIL_REDIRECTION_PENDING = "EMAIL_REDIRECTION_PENDING",
  EMAIL_REDIRECTION_ACTIVE = "EMAIL_REDIRECTION_ACTIVE",
  EMAIL_VERIFICATION_WAITING = "EMAIL_VERIFICATION_WAITING",
  EMAIL_CREATION_WAITING = "EMAIL_CREATION_WAITING", // email will be created
  MEMBER_VALIDATION_WAITING = "MEMBER_VALIDATION_WAITING",
}

export enum GenderCode {
  NSP = "NSP",
  FEMALE = "female",
  MALE = "male",
  OTHER = "other",
}

export enum LegalStatus {
  AE = "AE",
  contractuel = "contractuel",
  EIRL = "EIRL",
  EURL = "EURL",
  fonctionnaire = "fonctionnaire",
  PORTAGE = "PORTAGE",
  asso = "asso",
  SA = "SA",
  SASU = "SASU",
  SNC = "SNC",
  salarie_agence = "salarie_agence",
}

export enum CommunicationEmailCode {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

export enum MemberType {
  BETA = "beta",
  ATTRIBUTAIRE = "attributaire",
  DINUM = "dinum",
  OTHER = "autre",
}

export const genderOptions = [
  {
    key: "female",
    name: "Féminin",
  },
  {
    key: "male",
    name: "Masculin",
  },
  {
    key: "other",
    name: "Autre",
  },
  {
    key: "NSP",
    name: "Ne se prononce pas",
  },
];

export const statusOptions: {
  key: keyof typeof LegalStatus;
  name: string;
}[] = [
  {
    key: "AE",
    name: "Auto-entreprise/micro-entreprise",
  },
  {
    key: "contractuel",
    name: "Contractuel-elle",
  },
  {
    key: "EIRL",
    name: "Entreprise individuelle : EI ou EIRL",
  },
  {
    key: "EURL",
    name: "EURL",
  },
  {
    key: "fonctionnaire",
    name: "Fonctionnaire",
  },
  {
    key: "PORTAGE",
    name: "Portage salarial",
  },
  {
    key: "asso",
    name: "Salarié-e d'une coopérative (CAE, SCOP, Association)",
  },
  {
    key: "SA",
    name: "Salarié-e d'une entreprise (SA, SAS, SARL)",
  },
  {
    key: "SASU",
    name: "SASU",
  },
  {
    key: "SNC",
    name: "SNC",
  },
  {
    key: "salarie_agence",
    name: "Agent d'un opérateur de l'Etat (ADEME, France Travail...)",
  },
];

export enum Domaine {
  ANIMATION = "Animation",
  COACHING = "Coaching",
  DEPLOIEMENT = "Déploiement",
  DESIGN = "Design",
  DEVELOPPEMENT = "Développement",
  INTRAPRENARIAT = "Intraprenariat",
  PRODUIT = "Produit",
  AUTRE = "Autre",
  DATA = "Data",
  SUPPORT = "Support",
  ATTRIBUTAIRE = "Attributaire",
}

type DomaineOption = {
  key: keyof typeof Domaine;
  name: Domaine;
};

export const DOMAINE_OPTIONS: DomaineOption[] = [
  {
    key: "ANIMATION",
    name: Domaine.ANIMATION,
  },
  {
    key: "COACHING",
    name: Domaine.COACHING,
  },
  {
    key: "DEPLOIEMENT",
    name: Domaine.DEPLOIEMENT,
  },
  {
    key: "DESIGN",
    name: Domaine.DESIGN,
  },
  {
    key: "DEVELOPPEMENT",
    name: Domaine.DEVELOPPEMENT,
  },
  {
    key: "INTRAPRENARIAT",
    name: Domaine.INTRAPRENARIAT,
  },
  {
    key: "PRODUIT",
    name: Domaine.PRODUIT,
  },
  {
    key: "AUTRE",
    name: Domaine.AUTRE,
  },
  {
    key: "DATA",
    name: Domaine.DATA,
  },
  {
    key: "SUPPORT",
    name: Domaine.SUPPORT,
  },
  {
    key: "ATTRIBUTAIRE",
    name: Domaine.ATTRIBUTAIRE,
  },
];

export const memberSchema = z.object({
  // modify info schema
  uuid: z.string({}).uuid().readonly(),
  username: z.string({}).readonly(),
  fullname: z
    .string({
      error: "Le nom est obligatoire",
    })
    .min(1)
    .readonly()
    .describe("Nom complet"),
  role: z
    .string({
      error: "Le rôle est un champ obligatoire",
    })
    .min(1)
    .describe("Rôle actuel"),
  link: z
    .union([
      z.null(),
      z.literal(""),
      z.string().trim().url({ message: "URL invalide" }).optional(),
    ])
    .describe("Adresse du profil LinkedIn ou site web"),
  avatar: z.string().nullable().optional().describe("URL ou slug de l'avatar"),
  github: z.string().optional().nullable().describe("Login GitHub"),
  competences: z
    .array(z.string())
    .max(MAX_TAGS)
    .optional()
    .nullable()
    .describe("Liste des compétences"),
  teams: z
    .array(teamSchema)
    .max(MAX_MEMBER_MISSIONS)
    .optional()
    .nullable()
    .describe("Liste des équipes incubateurs"),
  missions: z
    .array(missionSchema)
    .min(1, "Vous devez définir au moins une mission")
    .max(MAX_MEMBER_MISSIONS),
  startups: z.array(z.string()).max(MAX_RELATED_IDS).optional().nullable(),
  previously: z.array(z.string()).max(MAX_RELATED_IDS).optional().nullable(),
  domaine: z.nativeEnum(
    Domaine, // ??
    {
      error: "Le domaine est un champ obligatoire",
    },
  ), // ??
  bio: z
    .string({
      error:
        "La bio est optionnelle mais elle permet d'en dire plus sur toi, be creative",
    })
    .optional()
    .nullable()
    .describe("Courte bio"),
  memberType: z.nativeEnum(MemberType).optional().nullable(),
  // email relative info
  secondary_email: z
    .string({
      error: "L'email est obligatoire",
    })
    .email()
    .describe("Email"),
  isEmailBetaAsked: z.boolean().optional().nullable(),
  email_is_redirection: z.boolean().optional(),
  communication_email: z.nativeEnum(CommunicationEmailCode),
  // stat info
  gender: z
    .nativeEnum(
      GenderCode, // ??
      {
        error: "Le champ gender est obligatoire",
      },
    )
    .optional()
    .nullable(),
  average_nb_of_days: z
    .number()
    .max(5)
    .nullable()
    .optional()
    .describe("Nombre de jour moyen travaillé par semaine"),
  legal_status: z
    .nativeEnum(
      LegalStatus, // ??
      {
        error: "Le status legal n'a pas une valeur correcte",
      },
    )
    .optional()
    .describe(`Status legal de l'entreprise`),
  workplace_insee_code: z
    .string()
    .nullable()
    .optional()
    .describe("Code postal de la ville"),
  osm_city: z.string().nullable().optional().describe("Ville internationale"),
  primary_email: z.string().email().nullable(),
  primary_email_status: z.nativeEnum(EmailStatusCode).readonly(),
  primary_email_status_updated_at: z.date().readonly(),
  created_at: z.date().readonly(),
  updated_at: z.date().readonly(),
});
export type memberSchemaType = z.infer<typeof memberSchema>;

export const EmailInfosSchema = z.object({
  email: z.string().email(), // Validation supplémentaire pour vérifier le format de l'email
  isBlocked: z.boolean(),
  emailPlan: z.nativeEnum(EMAIL_PLAN_TYPE),
});
export type EmailInfos = z.infer<typeof EmailInfosSchema>;

export const memberWrapperSchema = z.object({
  userInfos: memberSchema,
  isExpired: z.boolean(),
  emailInfos: EmailInfosSchema.nullable(),
  emailRedirections: z.array(RedirectionSchema),
  authorizations: z.object({
    canChangePassword: z.boolean(),
    canChangeEmails: z.boolean(),
    hasPublicServiceEmail: z.boolean(),
  }),
});

export type memberWrapperSchemaType = z.infer<typeof memberWrapperSchema>;

// member info that other member can get
export const memberBaseInfoSchema = memberSchema.pick({
  uuid: true,
  username: true,
  fullname: true,
  role: true,
  domaine: true,
  bio: true,
  link: true,
  github: true,
  missions: true,
  teams: true,
  primary_email: true,
  primary_email_status: true,
  memberType: true,
  primary_email_status_updated_at: true,
  communication_email: true,
  secondary_email: true,
  email_is_redirection: true,
  created_at: true,
  updated_at: true,
  competences: true,
  legal_status: true,
  workplace_insee_code: true,
});

export type memberBaseInfoSchemaType = z.infer<typeof memberBaseInfoSchema>;

export const memberPublicInfoSchema = memberSchema.pick({
  uuid: true,
  username: true,
  fullname: true,
  role: true,
  domaine: true,
  bio: true,
  link: true,
  github: true,
  missions: true,
  teams: true,
  competences: true,
  workplace_insee_code: true,
  // primary_email: true,
  primary_email_status: true,
  // communication_email: true,
  // secondary_email: true,
});

export type memberPublicInfoSchemaType = z.infer<typeof memberPublicInfoSchema>;

export const memberWrapperPublicInfoSchema = z.object({
  userPublicInfos: memberPublicInfoSchema,
  isExpired: z.boolean(),
  isEmailBlocked: z.boolean(),
  hasEmailInfos: z.boolean(),
  hasSecondaryEmail: z.boolean(),
});

export type memberWrapperPublicInfoSchemaType = z.infer<
  typeof memberWrapperPublicInfoSchema
>;

export type HasMissions<T = any> = T & {
  missions: z.infer<typeof missionSchema>[];
};
