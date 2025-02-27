import { addMonths } from "date-fns/addMonths";
import { z } from "zod";

import { FileType } from "@/lib/file";
import { memberSchema } from "@/models/member";

const sixMonthsFromNow = addMonths(new Date());

export const memberInfoUpdateSchema = z.object({
    member: z.object({
        fullname: memberSchema.shape.fullname,
        role: memberSchema.shape.role,
        link: memberSchema.shape.link,
        avatar: memberSchema.shape.avatar,
        github: memberSchema.shape.github,
        competences: memberSchema.shape.competences,
        teams: memberSchema.shape.teams,
        missions: memberSchema.shape.missions.refine(
            (missions) =>
                missions.every(
                    (mission) =>
                        (!mission.end ||
                            new Date(mission.end) <= sixMonthsFromNow) &&
                        mission.status !== "admin"
                ),
            {
                message:
                    "La date de fin mission ne peut pas être supérieure à 6 mois dans le futur.",
            }
        ),
        domaine: memberSchema.shape.domaine,
        bio: memberSchema.shape.bio,
        memberType: memberSchema.shape.memberType,
        gender: memberSchema.shape.gender,
        average_nb_of_days: memberSchema.shape.average_nb_of_days,
        tjm: memberSchema.shape.tjm,
        legal_status: memberSchema.shape.legal_status,
        workplace_insee_code: memberSchema.shape.workplace_insee_code,
        osm_city: memberSchema.shape.osm_city,
    }),
    picture: z
        .instanceof(FileType)
        .refine((file) => file.size > 0, "File is required")
        .nullable()
        .optional(),
    shouldDeletePicture: z.boolean().optional().nullable(),
});

export type memberInfoUpdateSchemaType = z.infer<typeof memberInfoUpdateSchema>;

export const memberValidateInfoSchema = z.object({
    fullname: memberSchema.shape.fullname,
    role: memberSchema.shape.role,
    link: memberSchema.shape.link,
    avatar: memberSchema.shape.avatar,
    github: memberSchema.shape.github,
    competences: memberSchema.shape.competences,
    missions: memberSchema.shape.missions,
    domaine: memberSchema.shape.domaine,
    bio: memberSchema.shape.bio,
    memberType: memberSchema.shape.memberType,
    gender: memberSchema.shape.gender,
    secondary_email: memberSchema.shape.secondary_email,
    average_nb_of_days: memberSchema.shape.average_nb_of_days,
    tjm: memberSchema.shape.tjm,
    legal_status: memberSchema.shape.legal_status,
    workplace_insee_code: memberSchema.shape.workplace_insee_code,
    osm_city: memberSchema.shape.osm_city,
});

export type memberValidateInfoSchemaType = z.infer<
    typeof memberValidateInfoSchema
>;

export const createMemberSchema = z
    .object({
        member: z.object({
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
                .transform((email) => email.toLowerCase())
                .describe("Email"),
            domaine: memberSchema.shape.domaine,
        }),
        missions: memberSchema.shape.missions,
        incubator_id: z.string().uuid().optional(),
    })
    .refine(
        (data) => {
            // Check if any mission contains a "startup"
            const hasStartup = !!data.missions[0].startups?.length;
            // If no startup is present, incubator must be required
            return hasStartup || !!data.incubator_id;
        },
        {
            message:
                "L'incubateur est obligatoire si aucune startup n'est définie dans la mission.",
            path: ["incubator_id"], // Attach error to incubator
        }
    );

export type createMemberSchemaType = z.infer<typeof createMemberSchema>;

export const createMemberResponseSchema = z
    .object({
        uuid: z.string().uuid(),
        validated: z.boolean(),
    })
    .strict();
export type createMemberResponseSchemaType = z.infer<
    typeof createMemberResponseSchema
>;

export const updateMemberMissionsSchema = z.object({
    missions: memberSchema.shape.missions,
    memberUuid: memberSchema.shape.uuid,
});

export type updateMemberMissionsSchemaType = z.infer<
    typeof updateMemberMissionsSchema
>;

export const validateNewMemberSchema = z.object({
    memberUuid: z.string().uuid(),
});
export type validateNewMemberSchemaType = z.infer<
    typeof validateNewMemberSchema
>;
