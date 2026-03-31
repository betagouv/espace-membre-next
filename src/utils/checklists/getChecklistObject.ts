import * as Sentry from "@sentry/node";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";

import { checklistSchema, checklistSchemaType } from "@/models/checklist";

const allowedChecklists = ["onboarding" as const, "offboarding" as const];

export async function getChecklistObject(
  type: (typeof allowedChecklists)[number],
): Promise<checklistSchemaType | null> {
  // Validate type to prevent path traversal
  if (!allowedChecklists.includes(type)) {
    Sentry.captureException(new Error("Invalid checklist type requested"));
    throw new Error(`Invalid checklist type requested: ${type}`);
  }

  const filePath = path.join(
    process.cwd(),
    "src/utils/checklists",
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
