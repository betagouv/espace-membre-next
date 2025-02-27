import { startBossClientInstance } from "./client";
import { sendEmailToTeamsToCheckOnTeamCompositionTopic } from "./workers/send-email-to-teams-to-check-on-team-composition";

export async function scheduleCronTasks() {
    const bossClient = await startBossClientInstance();

    // cron tasks
    await bossClient.schedule(
        sendEmailToTeamsToCheckOnTeamCompositionTopic,
        `0 8 1,2,3,4,5,6,7 */3 1`, // Runs at 08:00 AM on monday every 3rd month
        undefined,
        { tz: "Europe/Paris" }
    );
}
