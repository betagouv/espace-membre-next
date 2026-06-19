import { z } from "zod";

import {
  OPS_DEMANDE_COMMENT_REQUIRED,
  OPS_DEMANDE_FIELDS,
  OPS_DEMANDE_TYPE,
  OPS_FIELDS,
  OPS_STATUT,
} from "../ops";

export const opsRequestSchema = z
  .object({
    tchapId: z
      .string({ required_error: "Ton identifiant Tchap est requis" })
      .min(1, "Ton identifiant Tchap est requis"),
    email: z
      .string({ required_error: "Ton email est requis" })
      .email("Email invalide"),
    demande: z.nativeEnum(OPS_DEMANDE_TYPE, {
      required_error: "Précise le type de demande",
      invalid_type_error: "Précise le type de demande",
    }),
    projet: z.string().optional(),
    // Per-demande conditional fields (see OPS_DEMANDE_FIELDS).
    nomApp: z.string().optional(),
    emailCollaborateur: z.string().optional(),
    handleOvh: z.string().optional(),
    zoneDns: z.string().optional(),
    urlSite: z.string().optional(),
    emailAssocier: z.string().optional(),
    urlSurveiller: z.string().optional(),
    emailsNotifier: z.string().optional(),
    commentaires: z.string().optional(),
    prenomNom: z.string().optional(),
    statut: z.nativeEnum(OPS_STATUT).optional(),
  })
  .superRefine((data, ctx) => {
    const fields = OPS_DEMANDE_FIELDS[data.demande] ?? [];
    const commentRequired = OPS_DEMANDE_COMMENT_REQUIRED.includes(data.demande);
    for (const key of fields) {
      const field = OPS_FIELDS[key];
      const required =
        field.required || (key === "commentaires" && commentRequired);
      if (required && !data[key]?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${field.label} est requis`,
        });
      }
    }
  });

export type opsRequestSchemaType = z.infer<typeof opsRequestSchema>;
