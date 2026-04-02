import PgBoss from "pg-boss";

import { unblockEmailsThatAreActive } from "@/server/schedulers/unblockEmailsThatAreActive";

export const unblockBlacklistedEmailsTopic = "unblock-blacklisted-emails";

export async function unblockBlacklistedEmails(job?: PgBoss.Job<void>) {
  await unblockEmailsThatAreActive();
}
