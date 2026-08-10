// NOTE: if you update this file, make sure you update the jobs
// documentation file (CRON.md) file with `make cron-docs`.

import { getBossClientInstance, startBossClientInstance } from "./client";
import { syncDinumEmailsTopic } from "./workers/sync-dinum-emails";
import { cleanTeamsMembersTopic } from "./workers/clean-teams-members";
import { syncMatrixAccountsTopic } from "./workers/sync-matrix-accounts";

export type PgBossJobType = {
  topic: string;
  frequency: string;
  description: string;
};

export const pgBossJobs: PgBossJobType[] = [
  {
    topic: syncDinumEmailsTopic,
    frequency: `0 8-18 * * *`,
    description: `Met à jour la table dinum_emails`,
  },
  {
    topic: cleanTeamsMembersTopic,
    frequency: `0 8 * * *`,
    description: `Supprime les membres expirés des équipes incubateurs`,
  },
  {
    topic: syncMatrixAccountsTopic,
    frequency: `0 3 * * *`,
    description: `Indexe les comptes Matrix (Tchap) des utilisateurs`,
  },
];

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
