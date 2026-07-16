// NOTE: if you update this file, make sure you update the jobs
// documentation file (CRON.md) file with `make cron-docs`.

import { recreateEmailIfUserActive } from "./recreateEmailIfUserActive"; // todo: n8n
import { sendEmailToStartupToUpdatePhase } from "./startups/sendEmailToStartupToUpdatePhase";
import config from "@/server/config";

export interface EspaceMembreCronJobType {
  cronTime: string;
  onTick: (any) => any;
  isActive: boolean;
  name: string;
  description?: string;
  timeZone?: string;
  start?: boolean;
}

// todo: move to n8n
const startupJobs: EspaceMembreCronJobType[] = [
  {
    cronTime: "30 09 01 Jan,Apr,Jul,Oct *", // 1st of Jan, Apr, Jul, Oct at 09:00:30
    onTick: sendEmailToStartupToUpdatePhase,
    isActive: config.FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE,
    name: "sendEmailToStartupToUpdatePhase",
    description:
      "Envoie par mail une relance pour mise à jour de la phase de la SE",
  },
];

export const espaceMembreCronJobs: EspaceMembreCronJobType[] = [
  ...startupJobs,
  // todo: move to n8n ?
  {
    cronTime: "0 * * * *", // Every hour
    onTick: recreateEmailIfUserActive,
    isActive: true,
    name: "recreateEmailIfUserActive",
    description: "Recreate email for user active again",
  },
];
