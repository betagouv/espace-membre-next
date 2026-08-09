import { z } from "zod";

import { incubatorApiResponseSchema } from "./incubator";
import {
  CommunicationEmailCode,
  EmailStatusCode,
  MemberType,
} from "@/models/member";
import { teamSchema } from "@/models/team";

// Chemin de rattachement d'un membre a un incubateur.
export enum IncubatorMemberAttachment {
  STARTUPS = "startups",
  TEAMS = "teams",
  BOTH = "both",
}

// Startup telle qu'exposee dans une mission de l'API protegee : couple
// { uuid, ghid }. Le ghid est l'identifiant public reutilisable en entree des
// routes ; l'uuid n'est present que pour la correlation et n'est jamais accepte
// en entree.
export const protectedMissionStartupSchema = z.object({
  uuid: z.string(),
  ghid: z.string(),
});
export type protectedMissionStartupSchemaType = z.infer<
  typeof protectedMissionStartupSchema
>;

// Mission telle qu'exposee par l'API protegee.
export const protectedApiMissionSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date().nullable().optional(),
  status: z.string().nullable().optional(),
  employer: z.string().nullable().optional(),
  startups: z.array(protectedMissionStartupSchema),
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
  startups: z.array(protectedMissionStartupSchema).optional(),
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
