const fs = require("fs");
const yaml = require("js-yaml");
const { onboardingChecklistSchema } = require("../../../src/models/onboardingChecklist"); // Adjust path

// Read the YAML file
const rawYaml = fs.readFileSync("../../../public/onboarding/checklist.yml", "utf8");

let data;

try {
  data = yaml.load(rawYaml); // Parse YAML to JS object
} catch (e) {
  console.error("YAML parsing error:", e);
  process.exit(1);
}

// Validate the data using Zod schema
try {
  onboardingChecklistSchema.parse(data);
  console.log("✅ Validation passed!");
} catch (error) {
  console.error("❌ Validation failed:", error.errors);
  process.exit(1);
}
