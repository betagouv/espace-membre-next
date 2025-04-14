import fs from "fs";
import path from "path";

import { jobs } from "./src/server/schedulers/cron";
import { pgBossJob } from "@/server/queueing/schedule";

function generateMarkdown(jobs: any): string {
    const header = `# Liste des cron jobs\n\n| enabled | fréquence | code | description |\n|---------|-----------|------|-------------|`;
    const rows = Object.entries(jobs).map(([key, job]: [string, any]) => {
        const enabled = job.enabled ?? true;
        const schedule = job.schedule ?? "";
        const description = job.description ?? "";
        const code = job.name ?? "";
        return `| ${enabled} | \`${schedule}\` | \`${code}\` | ${description} |`;
    });

    return `${header}\n${rows.join("\n")}\n`;
}

function generatePGBossMarkdown(
    jobs: { topic: string; frequency: string }[]
): string {
    const header = `# Liste des jobs pg-boss\n\n| fréquence | topic |\n|-----------|--------|`;
    const rows = jobs.map((job) => {
        const freq = job.frequency;
        const topic = job.topic;
        return `| \`${freq}\` | \`${topic}\` |`;
    });

    return `${header}\n${rows.join("\n")}\n`;
}

function writeToFile(content: string) {
    const filePath = path.join(process.cwd(), "cron.md");
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("✅ Fichier cron.md généré avec succès !");
}

const markdownCron = generateMarkdown(jobs);
const markdownPgboss = generatePGBossMarkdown(pgBossJob);
const markdown = [markdownCron, markdownPgboss].join("\n");
writeToFile(markdown);
