import * as Sentry from "@sentry/node";
import fs from "fs/promises";
import path from "path";
import yaml from "yaml";

import {
    onboardingChecklistSchema,
    onboardingChecklistSchemaType,
} from "@/models/onboardingChecklist";

export async function getChecklistObject(): Promise<onboardingChecklistSchemaType | null> {
    const filePath = path.join(
        process.cwd(),
        "public",
        "onboarding",
        "checklist.yml"
    );
    const fileContents = await fs.readFile(filePath, "utf-8");

    const parsed = onboardingChecklistSchema.safeParse(
        yaml.parse(fileContents)
    );

    if (!parsed.success) {
        Sentry.captureException(
            new Error("Invalid onboarding checklist YAML"),
            {
                extra: {
                    issues: parsed.error.format(),
                    raw: fileContents,
                },
            }
        );
        return null;
    }
    return parsed.data;
}
