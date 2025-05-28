import z from "zod";

import {
    MaintenanceDataSchema,
    MaintenanceWrapperDataSchema,
} from "./maintenance";
import { MATOMO_SITE_TYPE } from "../actions/service";
import { SentryRole } from "@/lib/sentry";

export const CreateMattermostAccountDataSchema =
    MaintenanceWrapperDataSchema.extend({
        email: z.string().email(), // Valide que l'email est bien formaté
        username: z.string().min(1, "Le nom d'utilisateur est requis"), // Valide que le nom d'utilisateur n'est pas vide
        password: z
            .string()
            .min(6, "Le mot de passe doit contenir au moins 6 caractères"), // Valide que le mot de passe contient au moins 6 caractères
        position: z.string().min(2, "Le role est requis"),
        requestId: z.string().uuid(),
    }).strict();
export type CreateMattermostAccountDataSchemaType = z.infer<
    typeof CreateMattermostAccountDataSchema
>;

export const CreateOrUpdateMatomoAccountDataSchema =
    MaintenanceWrapperDataSchema.extend({
        email: z.string().email(), // Valide que l'email est bien formaté
        login: z.string().min(1, "Le nom d'utilisateur est requis"), // Valide que le nom d'utilisateur n'est pas vide
        password: z
            .string()
            .min(6, "Le mot de passe doit contenir au moins 6 caractères"), // Valide que le mot de passe contient au moins 6 caractères
        sites: z
            .array(
                z.object({
                    id: z.number(),
                }),
            )
            .optional(),
        newSite: z
            .object({
                url: z.string(),
                name: z.string().optional(),
                type: z.nativeEnum(MATOMO_SITE_TYPE),
                startupId: z.string(),
            })
            .optional(),
        username: z.string(),
        userUuid: z.string().uuid(),
        requestId: z.string().uuid(),
    }).strict();
export type CreateOrUpdateMatomoAccountDataSchemaType = z.infer<
    typeof CreateOrUpdateMatomoAccountDataSchema
>;

export const CreateSentryAccountDataSchema =
    MaintenanceWrapperDataSchema.extend({
        teams: z.array(
            z.object({
                teamSlug: z.string(),
                teamRole: z.nativeEnum(SentryRole),
            }),
        ),
        email: z.string().email(),
        username: z.string(), // used to logged infortion
        userUuid: z.string().uuid(),
        requestId: z.string().uuid(),
    }).strict();
export type CreateSentryAccountDataSchemaType = z.infer<
    typeof CreateSentryAccountDataSchema
>;

export const CreateSentryTeamDataSchema = MaintenanceWrapperDataSchema.extend({
    startupId: z.string(),
    userUuid: z.string().uuid(),
    email: z.string().email(),
    username: z.string(), // used to logged infortion
    requestId: z.string().uuid(),
}).strict();

export type CreateSentryTeamDataSchemaType = z.infer<
    typeof CreateSentryTeamDataSchema
>;

export const UpdateSentryAccountDataSchema =
    MaintenanceWrapperDataSchema.extend({
        teams: z.array(
            z.object({
                teamSlug: z.string(),
                teamRole: z.nativeEnum(SentryRole),
            }),
        ),
        email: z.string().email(),
        username: z.string(), // used to logged infortion
        userUuid: z.string().uuid(),
        memberId: z.string(),
        requestId: z.string().uuid(),
    }).strict();

export type UpdateSentryAccountDataSchemaType = z.infer<
    typeof UpdateSentryAccountDataSchema
>;
