import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { onboardingChecklistSchema } from "../../../src/models/onboardingChecklist";

// Define the path to the YAML file
const yamlPath = path.resolve(__dirname, "../../../public/onboarding/checklist.yml");

// Read the raw YAML file
const rawYaml = fs.readFileSync(yamlPath, "utf8");

let data: unknown;

try {
  // Parse YAML to JS object
  data = yaml.load(rawYaml);
} catch (e) {
  console.error("YAML parsing error:", e);
  process.exit(1);
}

// Validate the data using Zod schema
try {
  onboardingChecklistSchema.parse(data);
  console.log("✅ Validation passed!");
} catch (error: any) {
  console.error("❌ Validation failed:", error.errors);
  process.exit(1);
}
