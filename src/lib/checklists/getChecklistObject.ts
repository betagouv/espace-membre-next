import * as Sentry from "@sentry/node";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";

import { checklistSchema, checklistSchemaType } from "@/models/checklist";
import { Domaine } from "@/models/member";

export const allowedChecklists = [
  "onboarding" as const,
  "onboarding-intrapreneur" as const,
  "offboarding" as const,
];

export type ChecklistType = (typeof allowedChecklists)[number];

/**
 * Mise en place du parcours d'embarquement des intrapreneur·es. Les intras
 * arrivés avant gardent la checklist commune, déjà entamée : basculer sur la
 * nouvelle ferait chuter leur progression et rouvrirait leur embarquement.
 */
export const ONBOARDING_INTRAPRENEUR_START = new Date("2026-09-28");

/**
 * Les nouveaux intrapreneur·es ont leur propre parcours d'embarquement, tourné
 * vers le pilotage de leur produit et la certification des intras.
 */
export function getOnboardingChecklistType(
  domaine: Domaine,
  createdAt: Date,
): ChecklistType {
  return domaine === Domaine.INTRAPRENARIAT &&
    createdAt >= ONBOARDING_INTRAPRENEUR_START
    ? "onboarding-intrapreneur"
    : "onboarding";
}

export async function getChecklistObject(
  type: ChecklistType,
): Promise<checklistSchemaType | null> {
  // Validate type to prevent path traversal
  if (!allowedChecklists.includes(type)) {
    Sentry.captureException(new Error("Invalid checklist type requested"));
    throw new Error(`Invalid checklist type requested: ${type}`);
  }

  const filePath = path.join(
    process.cwd(),
    "src/lib/checklists",
    `${type}.yml`,
  );
  const fileContents = await fs.readFile(filePath, "utf-8");

  const parsed = checklistSchema.safeParse(yaml.parse(fileContents));

  if (!parsed.success) {
    Sentry.captureException(new Error("Invalid checklist YAML"), {
      extra: {
        issues: parsed.error.format(),
        raw: fileContents,
      },
    });
    return null;
  }
  return parsed.data;
}
