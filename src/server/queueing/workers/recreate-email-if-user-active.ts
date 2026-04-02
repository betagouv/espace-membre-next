import PgBoss from "pg-boss";

import { recreateEmailIfUserActive } from "@/server/schedulers/recreateEmailIfUserActive";

export const recreateEmailIfUserActiveTopic = "recreate-email-if-user-active";

export async function recreateEmailIfUserActiveWorker(job?: PgBoss.Job<void>) {
  await recreateEmailIfUserActive();
}
