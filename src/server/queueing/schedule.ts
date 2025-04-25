import { getBossClientInstance, startBossClientInstance } from "./client";
import { sendEmailToIncubatorTeamTopic } from "./workers/send-email-to-incubator";
import { sendEmailToTeamsToCheckOnTeamCompositionTopic } from "./workers/send-email-to-teams-to-check-on-team-composition";

export type PgBossJobType = {
    topic: string;
    frequency: string;
    description: string;
};

export const pgBossJobs: PgBossJobType[] = [
    {
        topic: sendEmailToTeamsToCheckOnTeamCompositionTopic,
        frequency: `0 8 1 */3 *`,
        description: `Envoie un email aux équipes produits pour qu'ils vérifient la composition de leur équipe`,
    },
    {
        topic: sendEmailToIncubatorTeamTopic,
        frequency: `0 8 1 */3 *`,
        description: `Envoie un email aux équipes incubateur pour qu'ils vérifient les produits qui n'ont pas changé depuis X mois`,
    },
];

export async function scheduleBossCronTasks() {
    const bossClient = await getBossClientInstance();

    // cron tasks
    for (const job of pgBossJobs) {
        await bossClient.schedule(job.topic, job.frequency, undefined, {
            tz: "Europe/Paris",
        });
    }
    console.log(
        `Started ${pgBossJobs.length} pgboss cron jobs : \n ${pgBossJobs
            .map((job) => job.topic)
            .join("\n")}`
    );
}
