const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const { onboardingChecklistSchema } = require(path.resolve(__dirname, "../../../src/models/onboardingChecklist"));

// Read the YAML file
const yamlPath = path.resolve(__dirname, "../../../public/onboarding/checklist.yml");
const rawYaml = fs.readFileSync(yamlPath, "utf8");

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
