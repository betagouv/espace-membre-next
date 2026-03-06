import * as Sentry from "@sentry/node";
import fs from "fs/promises";
import path from "path";
import yaml from "yaml";

import { checklistSchema, checklistSchemaType } from "@/models/checklist";

export async function getChecklistObject(
  type: "onboarding" | "offboarding",
): Promise<checklistSchemaType | null> {
  const filePath = path.join(process.cwd(), "public", type, "checklist.yml");
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
