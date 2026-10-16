import { spawn } from "node:child_process";

import type { CronJob } from "@/scripts/runJobs";
import { cleanTeamsMembers } from "@/server/queueing/workers/clean-teams-members";
import { startSync } from "@/server/queueing/workers/sync-dinum-emails";
import { syncMatrixAccounts } from "@/server/queueing/workers/sync-matrix-accounts";
import { recreateEmailIfUserActive } from "@/server/schedulers/recreateEmailIfUserActive";

function runShellScript(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", [path], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${path} exited with code ${code} (signal ${signal})`),
        );
    });
  });
}

// Les jobs d'un créneau tournent l'un après l'autre, dans l'ordre du tableau :
// cet ordre fait partie du contrat (un job peut dépendre de l'état laissé par le précédent).
// Les heures sont en UTC (Scalingo Scheduler), cf. cron.json.
export const CRON_SLOTS = {
  hourly: [
    { name: "recreate-email-if-user-active", run: recreateEmailIfUserActive },
  ],
  "business-hours": [{ name: "sync-dinum-emails", run: startSync }],
  nightly: [{ name: "sync-matrix-accounts", run: () => syncMatrixAccounts() }],
  morning: [{ name: "clean-teams-members", run: () => cleanTeamsMembers() }],
  "weekday-evening": [
    {
      name: "export-to-www",
      run: () => runShellScript("src/scripts/export-to-www.sh"),
    },
  ],
} satisfies Record<string, CronJob[]>;

export type CronSlot = keyof typeof CRON_SLOTS;
