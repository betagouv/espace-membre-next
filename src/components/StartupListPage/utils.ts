import { parseAsArrayOf, parseAsJson } from "nuqs";
import z from "zod";

export const startupsFilterSchema = z.object({
  type: z.enum([
    "techno",
    "usertype",
    "thematique",
    "incubator",
    "startup",
    "phase",
    "contact",
    "sans_suivi_dinum",
    "sans_suivi_incubateur",
  ]),
  value: z.union([z.string(), z.boolean()]).optional(),
});

export type SstartupsFilterSchemaType = z.infer<typeof startupsFilterSchema>;

export const startupsQueryParser = parseAsArrayOf(
  parseAsJson(startupsFilterSchema.parse),
).withDefault([]);
