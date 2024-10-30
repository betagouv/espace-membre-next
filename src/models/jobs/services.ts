import z from "zod";

import { MaintenanceWrapperDataSchema } from "./maintenance";

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
