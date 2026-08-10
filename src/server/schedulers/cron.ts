// NOTE: if you update this file, make sure you update the "Cron Jobs"
// section of the README.

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

// recreateEmailIfUserActive moved to a standalone script (`npm run
// job:recreate-email-if-user-active`) scheduled via the Scalingo Scheduler.
// See the README's "Cron Jobs" section.
export const espaceMembreCronJobs: EspaceMembreCronJobType[] = [];
