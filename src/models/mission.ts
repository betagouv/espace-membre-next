import { z } from "zod";

export enum Status {
  "independent" = "independent",
  "admin" = "admin",
  "service" = "service",
}

export const missionSchema = z.object({
  uuid: z.string().readonly().optional(),
  start: z
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
    .describe("Date de début de mission"),
  end: z
    .preprocess(
      (val) => {
        if (typeof val === "string") {
          return new Date(val);
        }
        return val;
      },
      z
        .date({
          error: "Champ obligatoire",
        })

        .optional(),
    )
    .optional()
    .nullable()
    .describe("Date de fin de mission"),
  status: z
    .enum(
      ["independent", "admin", "service"], // force status options
      {
        error: "Le statut est requis",
      },
    )
    .optional()
    .nullable()
    .describe("Type de contrat"),
  employer: z
    .string({
      error: "Précisez un employeur",
    })
    .optional()
    .nullable()
    .describe("Entité avec qui tu as contractualisé"),
  startups: z.array(z.string()).optional(),
});

export type missionSchemaType = z.infer<typeof missionSchema>;
export const missionSchemaShape = missionSchema.shape;
