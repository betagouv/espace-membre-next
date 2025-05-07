import fs from "fs";
import path from "path";

import {
    EspaceMembreCronJobType,
    espaceMembreCronJobs,
} from "./src/server/schedulers/cron";
import { pgBossJobs, PgBossJobType } from "@/server/queueing/schedule";

function generateMarkdown(jobs: EspaceMembreCronJobType[]): string {
    const header = `# Liste des cron jobs\n\n| enabled | fréquence | code | description |\n|---------|-----------|------|-------------|`;
    const rows = Object.entries(jobs).map(([key, job]) => {
        const enabled = job.isActive ? `✅` : `❌`;
        const schedule = job.cronTime ?? "";
        const description = job.description ?? "";
        const code = job.name ?? "";
        return `| ${enabled} | \`${schedule}\` | \`${code}\` | ${description} |`;
    });

    return `${header}\n${rows.join("\n")}\n`;
}

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

function writeToFile(content: string) {
    const filePath = path.join(process.cwd(), "CRON.md");
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("✅ Fichier cron.md généré avec succès !");
}

const markdownCron = generateMarkdown(espaceMembreCronJobs);
const markdownPgboss = generatePGBossMarkdown(pgBossJobs);
const markdown = [markdownCron, markdownPgboss].join("\n");
const filePath = path.resolve('CRON.md');
const oldContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';

if (markdown.trim() !== oldContent.trim()) {
  fs.writeFileSync(filePath, markdown, 'utf-8');
  console.log('CRON.md updated');
} else {
  console.log('CRON.md is already up to date, skipping write');
}
