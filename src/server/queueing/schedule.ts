// NOTE: if you update this file, make sure you update the jobs
// documentation file (CRON.md) file with `make cron-docs`.

import { getBossClientInstance, startBossClientInstance } from "./client";

export type PgBossJobType = {
  topic: string;
  frequency: string;
  description: string;
};

// sync-dinum-emails, clean-teams-members and sync-matrix-accounts moved to
// standalone scripts (`npm run job:*`) scheduled via the Scalingo Scheduler
// (cron.json) instead of pg-boss cron scheduling. See CRON.md.
export const pgBossJobs: PgBossJobType[] = [];

export async function scheduleBossCronTasks() {
  const bossClient = await getBossClientInstance();

  // cron tasks
  for (const job of pgBossJobs) {
    console.log(`Start scheduled pbboss job ${job.topic} : ${job.frequency}`);
    await bossClient.schedule(job.topic, job.frequency, undefined, {
      tz: "Europe/Paris",
    });
  }
  console.log(
    `Started ${pgBossJobs.length} pgboss cron jobs : \n ${pgBossJobs
      .map((job) => job.topic)
      .join("\n")}`,
  );
}
