import PgBoss from "pg-boss";

import { sentryClient } from "@/server/config/sentry.config";
import { syncSentryAccounts } from "@/server/schedulers/serviceScheduler/syncSentryAccounts";

export const syncSentryAccountsTopic = "sync-sentry-accounts";

export async function syncSentryAccountsWorker(job?: PgBoss.Job<void>) {
  await syncSentryAccounts(sentryClient);
}
