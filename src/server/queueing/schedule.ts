import { startBossClientInstance } from "./client";
import { sendEmailToTeamsToCheckOnTeamCompositionTopic } from "./workers/send-email-to-teams-to-check-on-team-composition";

export async function startBossCronJobs() {
    // cron tasks
    const bossClient = await startBossClientInstance();

    await bossClient.schedule(
        sendEmailToTeamsToCheckOnTeamCompositionTopic,
        `0 3 1 */3 *`, // Runs at 03:00 AM on the 1st day of every 3rd month
        undefined,
        { tz: "Europe/Paris" }
    ); // At night to save performance
}
