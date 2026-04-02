import PgBoss from "pg-boss";

import { deleteMatomoAccount } from "@/server/schedulers/userContractEndingScheduler";

export const deleteMatomoAccountTopic = "delete-matomo-account";

export async function deleteMatomoAccountWorker(job?: PgBoss.Job<void>) {
  await deleteMatomoAccount();
}
