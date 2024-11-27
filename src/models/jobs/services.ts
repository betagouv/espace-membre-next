import z from "zod";

import {
    MaintenanceDataSchema,
    MaintenanceWrapperDataSchema,
} from "./maintenance";
import { SentryRole } from "@/lib/sentry";

export const CreateMattermostAccountDataSchema =
    MaintenanceWrapperDataSchema.extend({
        email: z.string().email(), // Valide que l'email est bien formaté
        username: z.string().min(1, "Le nom d'utilisateur est requis"), // Valide que le nom d'utilisateur n'est pas vide
        password: z
            .string()
            .min(6, "Le mot de passe doit contenir au moins 6 caractères"), // Valide que le mot de passe contient au moins 6 caractères
        position: z.string().min(2, "Le role est requis"),
    }).strict();
export type CreateMattermostAccountDataSchemaType = z.infer<
    typeof CreateMattermostAccountDataSchema
>;

export const CreateMatomoAccountDataSchema =
    MaintenanceWrapperDataSchema.extend({
        email: z.string().email(), // Valide que l'email est bien formaté
        login: z.string().min(1, "Le nom d'utilisateur est requis"), // Valide que le nom d'utilisateur n'est pas vide
        password: z
            .string()
            .min(6, "Le mot de passe doit contenir au moins 6 caractères"), // Valide que le mot de passe contient au moins 6 caractères
        sites: z.array(
            z.object({
                url: z.string(),
            })
        ),
    }).strict();
export type CreateMatomoAccountDataSchemaType = z.infer<
    typeof CreateMatomoAccountDataSchema
>;

export const CreateSentryAccountDataSchema =
    MaintenanceWrapperDataSchema.extend({
        teams: z.array(z.string()),
        email: z.string().email(),
        username: z.string(), // used to logged infortion
        userUuid: z.string(),
    }).strict();
export type CreateSentryAccountDataSchemaType = z.infer<
    typeof CreateSentryAccountDataSchema
>;
