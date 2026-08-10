// NOTE: if you update this file, make sure you update the jobs
// documentation file (CRON.md) file with `make cron-docs`.

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
// See CRON.md.
export const espaceMembreCronJobs: EspaceMembreCronJobType[] = [];
