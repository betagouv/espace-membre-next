import PgBoss from "pg-boss";

import { syncMattermostUserWithMattermostMemberInfosTable } from "@/server/schedulers/mattermostScheduler/syncMattermostUserWithMattermostMemberInfosTable";

export const syncMattermostUsersTopic = "sync-mattermost-users";

export async function syncMattermostUsers(job?: PgBoss.Job<void>) {
  await syncMattermostUserWithMattermostMemberInfosTable();
}
