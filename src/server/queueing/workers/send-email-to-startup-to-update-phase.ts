import PgBoss from "pg-boss";

import { sendEmailToStartupToUpdatePhase } from "@/server/schedulers/startups/sendEmailToStartupToUpdatePhase";

export const sendEmailToStartupToUpdatePhaseTopic =
  "send-email-to-startup-to-update-phase";

export async function sendEmailToStartupToUpdatePhaseWorker(
  job?: PgBoss.Job<void>,
) {
  await sendEmailToStartupToUpdatePhase();
}
