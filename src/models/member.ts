import { z } from "zod";

import { incubatorApiResponseSchema } from "./incubator";
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
      errorMap: (issue, ctx) => ({
        message: "Le nom est obligatoire",
      }),
    })
    .min(1)
    .readonly()
    .describe("Nom complet"),
  role: z
    .string({
      errorMap: (issue, ctx) => ({
        message: "Le rôle est un champ obligatoire",
      }),
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
  avatar: z.string().describe("URL ou slug de l'avatar").nullable().optional(),
  github: z.string().describe("Login GitHub").optional().nullable(),
  competences: z
    .array(z.string())
    .describe("Liste des compétences")
    .optional()
    .nullable(),
  teams: z
    .array(teamSchema)
    .describe("Liste des équipes incubateurs")
    .optional()
    .nullable(),
  missions: z
    .array(missionSchema)
    .min(1, "Vous devez définir au moins une mission"),
  startups: z.array(z.string()).optional().nullable(),
  previously: z.array(z.string()).optional().nullable(),
  domaine: z.nativeEnum(
    Domaine, // ??
    {
      errorMap: (issue, ctx) => ({
        message: "Le domaine est un champ obligatoire",
      }),
    },
  ), // ??
  bio: z
    .string({
      errorMap: (issue, ctx) => ({
        message:
          "La bio est optionnelle mais elle permet d'en dire plus sur toi, be creative",
      }),
    })
    .describe("Courte bio")
    .optional()
    .nullable(),
  memberType: z.nativeEnum(MemberType).optional().nullable(),
  // email relative info
  secondary_email: z
    .string({
      errorMap: (issue, ctx) => ({
        message: "L'email est obligatoire",
      }),
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
        errorMap: (issue, ctx) => ({
          message: "Le champ gender est obligatoire",
        }),
      },
    )
    .optional()
    .nullable(),
  average_nb_of_days: z
    .number()
    .describe("Nombre de jour moyen travaillé par semaine")
    .max(5)
    .nullable()
    .optional(),
  legal_status: z
    .nativeEnum(
      LegalStatus, // ??
      {
        errorMap: (issue, ctx) => ({
          message: "Le status legal n'a pas une valeur correcte",
        }),
      },
    )
    .describe(`Status legal de l'entreprise`)
    .optional(),
  workplace_insee_code: z
    .string()
    .describe("Code postal de la ville")
    .nullable()
    .optional(),
  osm_city: z.string().describe("Ville internationale").nullable().optional(),
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

/* Schemas de reponse de l'API protegee (contrat machine) */

// Chemin de rattachement d'un membre a un incubateur.
export enum IncubatorMemberAttachment {
  STARTUPS = "startups",
  TEAMS = "teams",
  BOTH = "both",
}

// Mission telle qu'exposee par l'API protegee : les startups sont des GHID
// (pas des uuid internes) pour eviter au consommateur une jointure.
export const protectedApiMissionSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date().nullable().optional(),
  status: z.string().nullable().optional(),
  employer: z.string().nullable().optional(),
  startups: z.array(z.string()),
});
export type protectedApiMissionSchemaType = z.infer<
  typeof protectedApiMissionSchema
>;

// Champs communs des membres exposes par l'API protegee. Volontairement reduit :
// un registre d'acces n'a pas besoin de la bio, du domaine, du statut legal, etc.
export const protectedMemberSchema = z.object({
  uuid: z.string(),
  username: z.string(),
  fullname: z.string(),
  github: z.string().nullable(),
  primary_email: z.string().nullable(),
  secondary_email: z.string().nullable(),
  communication_email: z.nativeEnum(CommunicationEmailCode),
  primary_email_status: z.nativeEnum(EmailStatusCode),
  missions: z.array(protectedApiMissionSchema),
});
export type protectedMemberSchemaType = z.infer<typeof protectedMemberSchema>;

// Membre d'un incubateur : membre protege + discriminant de rattachement et
// GHID des equipes de l'incubateur auxquelles il appartient.
export const incubatorMemberSchema = protectedMemberSchema.extend({
  attachment: z.nativeEnum(IncubatorMemberAttachment),
  teams: z.array(z.string()),
});
export type incubatorMemberSchemaType = z.infer<typeof incubatorMemberSchema>;

// Sous-schemas pour la fiche membre detaillee /api/protected/members/{username},
// successeur formalise de l'ancienne route /member/{username}.
export const memberDetailMissionSchema = z.object({
  uuid: z.string().optional(),
  start: z.coerce.date(),
  end: z.coerce.date().nullable().optional(),
  status: z.string().nullable().optional(),
  employer: z.string().nullable().optional(),
  startups: z.array(z.string()).optional(),
});

export const memberDetailTeamSchema = teamSchema.extend({
  incubator: incubatorApiResponseSchema.nullable(),
});

export const memberDetailStartupSchema = z.object({
  uuid: z.string(),
  ghid: z.string().nullable(),
  name: z.string().nullable(),
  start: z.coerce.date().nullable(),
  end: z.coerce.date().nullable(),
  mailing_list: z.string().nullable(),
  incubator_id: z.string().nullable(),
  incubator: incubatorApiResponseSchema.nullable(),
  isCurrent: z.boolean(),
});

export const memberDetailApiResponseSchema = z.object({
  uuid: z.string(),
  username: z.string(),
  fullname: z.string(),
  role: z.string().nullable().optional(),
  domaine: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  primary_email: z.string().nullable(),
  secondary_email: z.string().nullable(),
  communication_email: z.nativeEnum(CommunicationEmailCode),
  primary_email_status: z.nativeEnum(EmailStatusCode),
  primary_email_status_updated_at: z.coerce.date().nullable().optional(),
  memberType: z.nativeEnum(MemberType).nullable().optional(),
  email_is_redirection: z.boolean().optional(),
  competences: z.array(z.string()).nullable().optional(),
  legal_status: z.string().nullable().optional(),
  workplace_insee_code: z.string().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  missions: z.array(memberDetailMissionSchema),
  teams: z.array(memberDetailTeamSchema).nullable(),
  startups: z.array(memberDetailStartupSchema),
  avatar: z.string().nullable(),
  isActive: z.boolean(),
});
export type memberDetailApiResponseSchemaType = z.infer<
  typeof memberDetailApiResponseSchema
>;
