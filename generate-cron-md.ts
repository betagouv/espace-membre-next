import fs from "fs";
import path from "path";

import { pgBossJobs, PgBossJobType } from "@/server/queueing/schedule";

function generatePGBossMarkdown(jobs: PgBossJobType[]): string {
  const header = `# Liste des jobs pg-boss\n\n| fréquence | topic | description |\n|-----------|--------|--------|`;
  const rows = jobs.map((job) => {
    const freq = job.frequency;
    const topic = job.topic;
    const description = job.description;
    return `| \`${freq}\` | \`${topic}\` | \`${description}\` |`;
  });

  return `${header}\n${rows.join("\n")}\n`;
}

const markdown = generatePGBossMarkdown(pgBossJobs);
const filePath = path.resolve("CRON.md");
const oldContent = fs.existsSync(filePath)
  ? fs.readFileSync(filePath, "utf-8")
  : "";

if (markdown.trim() !== oldContent.trim()) {
  fs.writeFileSync(filePath, markdown, "utf-8");
  console.log("CRON.md updated");
} else {
  console.log("CRON.md is already up to date, skipping write");
}
