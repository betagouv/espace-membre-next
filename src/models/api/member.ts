import { z } from "zod";

import { incubatorRefSchema } from "./incubator";

import { teamSchema } from "@/models/team";

// Chemin de rattachement d'un membre a un incubateur.
export enum IncubatorMemberAttachment {
  STARTUPS = "startups",
  TEAMS = "teams",
  BOTH = "both",
}

// Startup telle qu'exposee dans une mission de l'API v1 : couple
// { uuid, ghid }. Le ghid est l'identifiant public reutilisable en entree des
// routes ; l'uuid n'est present que pour la correlation et n'est jamais accepte
// en entree.
export const apiMissionStartupSchema = z.object({
  uuid: z.string(),
  ghid: z.string(),
});
export type apiMissionStartupSchemaType = z.infer<
  typeof apiMissionStartupSchema
>;

// Mission telle qu'exposee par l'API v1.
export const apiMissionSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date().nullable().optional(),
  status: z.string().nullable().optional(),
  employer: z.string().nullable().optional(),
  startups: z.array(apiMissionStartupSchema),
});
export type apiMissionSchemaType = z.infer<
  typeof apiMissionSchema
>;

// Champs communs des membres exposes par l'API v1. Volontairement reduit :
// un registre d'acces n'a pas besoin de la bio, du domaine, du statut legal, etc.
export const apiMemberSchema = z.object({
  uuid: z.string(),
  username: z.string(),
  fullname: z.string(),
  github: z.string().nullable(),
  primary_email: z.string().nullable(),
  // secondary_email reste expose sans portee ni masquage : c'est une decision.
  secondary_email: z.string().nullable(),
  missions: z.array(apiMissionSchema),
});
export type apiMemberSchemaType = z.infer<typeof apiMemberSchema>;

// Membre d'un incubateur : membre + discriminant de rattachement et
// GHID des equipes de l'incubateur auxquelles il appartient.
export const incubatorMemberSchema = apiMemberSchema.extend({
  attachment: z.nativeEnum(IncubatorMemberAttachment),
  teams: z.array(z.string()),
});
export type incubatorMemberSchemaType = z.infer<typeof incubatorMemberSchema>;

// Sous-schemas pour la fiche membre detaillee /api/v1/members/{id}.
export const memberDetailMissionSchema = z.object({
  uuid: z.string().optional(),
  start: z.coerce.date(),
  end: z.coerce.date().nullable().optional(),
  status: z.string().nullable().optional(),
  employer: z.string().nullable().optional(),
  startups: z.array(apiMissionStartupSchema).optional(),
});

// incubator_id est omis : une équipe n'a qu'un incubateur, l'objet incubator
// le porte déjà et son identifiant s'en déduit.
export const memberDetailTeamSchema = teamSchema
  .omit({ incubator_id: true })
  .extend({
    incubator: incubatorRefSchema.nullable(),
  });

export const memberDetailStartupSchema = z.object({
  uuid: z.string(),
  ghid: z.string().nullable(),
  name: z.string().nullable(),
  start: z.coerce.date().nullable(),
  end: z.coerce.date().nullable(),
  // incubator_id / incubator ne portent que l'incubateur principal. Un produit
  // co-incube expose la liste complete dans incubators.
  incubator_id: z.string().nullable(),
  incubator: incubatorRefSchema.nullable(),
  incubators: z.array(incubatorRefSchema),
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
  competences: z.array(z.string()).nullable().optional(),
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
