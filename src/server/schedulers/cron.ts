// NOTE: if you update this file, make sure you update the jobs
// documentation file (CRON.md) file with `make cron-docs`.

import { recreateEmailIfUserActive } from "./recreateEmailIfUserActive"; // todo: n8n
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

export const espaceMembreCronJobs: EspaceMembreCronJobType[] = [
  // todo: move to n8n ?
  {
    cronTime: "0 * * * *", // Every hour
    onTick: recreateEmailIfUserActive,
    isActive: true,
    name: "recreateEmailIfUserActive",
    description: "Recreate email for user active again",
  },
];
