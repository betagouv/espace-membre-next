import { parseAsArrayOf, parseAsJson } from "nuqs";
import z from "zod";

export const startupsFilterSchema = z.object({
  type: z.enum([
    "active_only",
    "techno",
    "usertype",
    "thematique",
    "incubator",
    "startup",
  ]),
  value: z.union([z.string(), z.boolean()]).optional(),
});

export type SstartupsFilterSchemaType = z.infer<typeof startupsFilterSchema>;

export const startupsQueryParser = parseAsArrayOf(
  parseAsJson(startupsFilterSchema.parse),
).withDefault([]);
