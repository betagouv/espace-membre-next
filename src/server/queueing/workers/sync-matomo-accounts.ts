import PgBoss from "pg-boss";

import { matomoClient } from "@/server/config/matomo.config";
import { syncMatomoAccounts } from "@/server/schedulers/serviceScheduler/syncMatomoAccounts";

export const syncMatomoAccountsTopic = "sync-matomo-accounts";

export async function syncMatomoAccountsWorker(job?: PgBoss.Job<void>) {
  await syncMatomoAccounts(matomoClient);
}
