import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { checklistSchema } from "../../src/models/checklist";

const checklistsDir = path.resolve(__dirname, "../../src/lib/checklists");
// Tous les yml du dossier : une nouvelle checklist est validée sans qu'il
// faille penser à l'ajouter ici.
const files = fs
  .readdirSync(checklistsDir)
  .filter((file) => file.endsWith(".yml"))
  .sort();

let allPassed = true;

for (const file of files) {
  const filePath = path.join(checklistsDir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = yaml.parse(raw);
  const result = checklistSchema.safeParse(parsed);

  if (result.success) {
    console.log(`✅ ${file}: validation passed`);
  } else {
    console.error(`❌ ${file}: validation failed`);
    console.error(result.error.format());
    allPassed = false;
  }
}

process.exit(allPassed ? 0 : 1);
