import { z } from "zod";

import {
  FORMATION_AUDIENCES,
  FORMATION_MODALITE,
  FORMATION_THEMATIQUES,
} from "@/models/formationsGrist";

export const formationProposalSchema = z.object({
  titre: z
    .string({ required_error: "Le titre est requis" })
    .trim()
    .min(1, "Le titre est requis")
    .max(150, "150 caractères maximum"),
  description: z
    .string({ required_error: "La description est requise" })
    .trim()
    .min(1, "La description est requise"),
  modalite: z.nativeEnum(FORMATION_MODALITE, {
    errorMap: () => ({ message: "La modalité est requise" }),
  }),
  thematiques: z
    .array(z.enum(FORMATION_THEMATIQUES as [string, ...string[]]))
    .min(1, "Choisis au moins une thématique"),
  audience: z
    .array(z.enum(FORMATION_AUDIENCES as [string, ...string[]]))
    .min(1, "Choisis au moins une audience"),
  // Champ vidé -> undefined côté formulaire (setValueAs), jamais "".
  capacite: z.coerce
    .number({ invalid_type_error: "Indique un nombre" })
    .int("Indique un nombre entier")
    .min(1, "Au moins une place")
    .max(500, "Nombre trop élevé")
    .optional(),
  duree: z.coerce
    .number({ invalid_type_error: "Indique un nombre" })
    .positive("La durée doit être positive")
    .max(40, "Durée trop élevée")
    .optional(),
});

export type formationProposalSchemaType = z.infer<
  typeof formationProposalSchema
>;
