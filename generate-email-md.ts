import fs from "fs";
import path from "path";

import { EmailDocumentation } from "@/server/modules/email/email";

// Ton objet des descriptions

// Génération du contenu Markdown
let markdown = `# 📧 Liste des types d’emails\n\n`;
markdown += `| Clé EMAIL_TYPES | Description |\n`;
markdown += `|-----------------|-------------|\n`;

for (const [key, description] of Object.entries(EmailDocumentation)) {
    markdown += `| \`${key}\` | ${description} |\n`;
}

// Écriture dans EMAIL.md
const filePath = path.join(process.cwd(), "EMAIL.md");
fs.writeFileSync(filePath, markdown, "utf-8");
console.log("✅ EMAIL.md généré avec succès !");
