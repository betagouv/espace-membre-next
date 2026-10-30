import { z } from "zod";

export const typesDocuments = [
  "Document de comité",
  "Rapport annuel",
  "Autre",
] as const;

export const docComiteDataSchema = z.object({
  date_comite: z
    .preprocess(
      (val) => {
        if (typeof val === "string") {
          return new Date(val);
        }
        return val;
      },
      z.date({
        error: "Champ obligatoire",
      }),
    )
    .describe("Date du comité d'investissement"),
  contenu: z
    .array(z.string().describe("Contenu du document"))
    .optional()
    .nullable()
    .describe("Que contient ce document ?"),
});

export const docSchema = z.object({
  title: z.string().describe("Titre du document").min(5),
  type: z.enum(typesDocuments).describe("Type de document"),
  comments: z
    .string()
    .optional()
    .describe("Commentaires sur le contenu du document"),
  data: z.any().optional().nullable(),
});

export type DocSchemaType = z.infer<typeof docSchema>;
