import { z } from "zod";

import { Domaine } from "./member";

export const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  domaines: z.array(z.nativeEnum(Domaine)).optional(),
  disabled: z.boolean().optional(),
  defaultValue: z.boolean().optional(),
  // Item non auto-déclaratif : seuls l'équipe d'animation et les admins
  // peuvent le cocher ou le décocher.
  restricted: z.boolean().optional(),
});

export const sectionSchema = z.object({
  title: z.string(),
  items: z.array(itemSchema),
  domaines: z.array(z.nativeEnum(Domaine)).optional(),
});

export const checklistSchema = z.array(sectionSchema);

export type checklistSchemaType = z.infer<typeof checklistSchema>;
