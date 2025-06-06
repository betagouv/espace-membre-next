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
        errorMap: (issue, ctx) => ({
          message: "Champ obligatoire",
        }),
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
          errorMap: (issue, ctx) => ({
            message: "Champ obligatoire",
          }),
        })

        .optional(),
    )
    .describe("Date de fin de mission")
    .optional()
    .nullable(),
  status: z
    .enum(
      ["independent", "admin", "service"], // force status options
      {
        errorMap: (issue, ctx) => ({
          message: "Le statut est requis",
        }),
      },
    )
    .describe("Type de contrat")
    .optional()
    .nullable(),
  employer: z
    .string({
      errorMap: (issue, ctx) => ({
        message: "Précisez un employeur",
      }),
    })
    .describe("Entité avec qui tu as contractualisé")
    .optional()
    .nullable(),
  startups: z.array(z.string()).optional(),
});

export type missionSchemaType = z.infer<typeof missionSchema>;
// if we use _def.schema on to define missionSchema, when missionSchema.parse is called, refined is not called
export const missionSchemaShape = missionSchema.shape;
