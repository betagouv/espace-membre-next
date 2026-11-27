import { z } from "zod";

import { Domaine } from "./member";

export const notConcernedReasonSchema = z.object({
  // Valeur stockée en base (user_events.not_concerned_reason) : ne pas la
  // renommer, les lignes existantes perdraient leur libellé.
  id: z.string().min(1),
  label: z.string().min(1),
  commentRequired: z.boolean().optional(),
});

export const NOT_CONCERNED_COMMENT_MAX_LENGTH = 500;

// Item que le membre peut déclarer « non concerné », avec un motif, au lieu de
// le cocher. Il compte alors comme fait dans la progression.
export const notConcernedSchema = z.object({
  label: z.string().min(1),
  reasons: z.array(notConcernedReasonSchema).min(1),
});

export const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  domaines: z.array(z.nativeEnum(Domaine)).optional(),
  disabled: z.boolean().optional(),
  defaultValue: z.boolean().optional(),
  // Item non auto-déclaratif : seuls l'équipe d'animation et les admins
  // peuvent le cocher ou le décocher.
  restricted: z.boolean().optional(),
  notConcerned: notConcernedSchema.optional(),
});

export const sectionSchema = z.object({
  title: z.string(),
  items: z.array(itemSchema),
  domaines: z.array(z.nativeEnum(Domaine)).optional(),
});

export const checklistSchema = z.array(sectionSchema);

export type checklistSchemaType = z.infer<typeof checklistSchema>;
export type checklistItemType = z.infer<typeof itemSchema>;
export type notConcernedSchemaType = z.infer<typeof notConcernedSchema>;
