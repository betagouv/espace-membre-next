import PgBoss from "pg-boss";

import { deleteSentryAccount } from "@/server/schedulers/userContractEndingScheduler";

export const deleteSentryAccountTopic = "delete-sentry-account";

export async function deleteSentryAccountWorker(job?: PgBoss.Job<void>) {
  await deleteSentryAccount();
}
