import { z } from "zod";

import {
  OPS_DEMANDE_COMMENT_REQUIRED,
  OPS_DEMANDE_FIELDS,
  OPS_DEMANDE_TYPE,
  OPS_FIELDS,
} from "../ops";

// L'auteur de la demande (email, identifiant Tchap, nom), son statut et le nom
// du produit ne figurent pas ici : le serveur les tire de la session et de la
// base, pour qu'ils ne puissent pas être modifiés depuis le navigateur.
export const opsRequestSchema = z
  .object({
    demande: z.nativeEnum(OPS_DEMANDE_TYPE, {
      required_error: "Précise le type de demande",
      invalid_type_error: "Précise le type de demande",
    }),
    projet: z.string().optional(),
    // Per-demande conditional fields (see OPS_DEMANDE_FIELDS).
    nomApp: z.string().optional(),
    zoneScalingo: z.string().optional(),
    emailCollaborateur: z.string().optional(),
    handleOvh: z.string().optional(),
    zoneDns: z.string().optional(),
    urlSite: z.string().optional(),
    emailAssocier: z.string().optional(),
    urlSurveiller: z.string().optional(),
    emailsNotifier: z.string().optional(),
    // Structured Sentry / Matomo fields (feed dedicated Grist columns).
    startupId: z.string().optional(),
    siteName: z.string().optional(),
    projetRattachement: z.string().optional(),
    nomWorkspace: z.string().optional(),
    emailEquipe: z.string().optional(),
    nomChaine: z.string().optional(),
    nomCompte: z.string().optional(),
    commentaires: z.string().optional(),
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

    // PeerTube refuse un nom de compte identique à celui de la chaîne, et les
    // tirets dans le nom de compte. Le formulaire le dit en hint, mais rien ne
    // l'empêchait : la demande partait chez l'équipe ops pour revenir en erreur.
    if (data.demande === OPS_DEMANDE_TYPE.PEERTUBE) {
      const nomCompte = data.nomCompte?.trim() ?? "";
      const nomChaine = data.nomChaine?.trim() ?? "";
      if (nomCompte.includes("-")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nomCompte"],
          message: "Le nom du compte ne peut pas contenir de tiret",
        });
      }
      if (
        nomCompte &&
        nomChaine &&
        nomCompte.toLowerCase() === nomChaine.toLowerCase()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nomCompte"],
          message: "Le nom du compte doit être différent du nom de la chaîne",
        });
      }
    }
  });

export type opsRequestSchemaType = z.infer<typeof opsRequestSchema>;
