import { z } from "zod";

import { Domaine } from "./member";

export const itemSchema = z.object({
    id: z.string(),
    title: z.string(),
    domaines: z.array(z.nativeEnum(Domaine)).optional(),
    disabled: z.boolean().optional(),
    defaultValue: z.boolean().optional(),
});

export const sectionSchema = z.object({
    title: z.string(),
    items: z.array(itemSchema),
    domaines: z.array(z.nativeEnum(Domaine)).optional(),
});

export const onboardingChecklistSchema = z.array(sectionSchema);

export type onboardingChecklistSchemaType = z.infer<
    typeof onboardingChecklistSchema
>;
