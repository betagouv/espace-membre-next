import { z } from "zod";

import { memberSchema } from "@/models/member";

export const baseInfoUpdateSchema = z.object({
    fullname: memberSchema.shape.fullname,
    role: memberSchema.shape.role,
    link: memberSchema.shape.link,
    avatar: memberSchema.shape.avatar,
    github: memberSchema.shape.github,
    competences: memberSchema.shape.competences,
    teams: memberSchema.shape.teams,
    missions: memberSchema.shape.missions,
    startups: memberSchema.shape.startups,
    previously: memberSchema.shape.previously,
    domaine: memberSchema.shape.domaine,
    bio: memberSchema.shape.bio,
    memberType: memberSchema.shape.memberType,
    gender: memberSchema.shape.gender,
    average_nb_of_days: memberSchema.shape.average_nb_of_days,
    tjm: memberSchema.shape.tjm,
    legal_status: memberSchema.shape.legal_status,
    workplace_insee_code: memberSchema.shape.workplace_insee_code,
    osm_city: memberSchema.shape.osm_city,
});

export type baseInfoUpdateSchemaType = z.infer<typeof baseInfoUpdateSchema>;

export const createMemberSchema = z.object({
    // to create user in
    firstname: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le prénom est obligatoire",
            }),
        })
        .describe("Prénom")
        .min(1),
    lastname: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "Le Nom est obligatoire",
            }),
        })
        .describe("Nom")
        .min(1),
    email: z
        .string({
            errorMap: (issue, ctx) => ({
                message: "L'email est obligatoire",
            }),
        })
        .email()
        .describe("Email"),
    missions: memberSchema.shape.missions,
    domaine: memberSchema.shape.domaine,
});

export type createMemberSchemaType = z.infer<typeof createMemberSchema>;
