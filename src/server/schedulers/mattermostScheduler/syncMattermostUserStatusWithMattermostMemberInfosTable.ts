import { db } from "@/lib/kysely";
import * as mattermost from "@/lib/mattermost";

export async function syncMattermostUserStatusWithMattermostMemberInfosTable() {
  const mattermostMemberInfos = await db
    .selectFrom("mattermost_member_infos")
    .selectAll()
    .execute();
  const ids = mattermostMemberInfos
    .map((m) => m.mattermost_user_id)
    .filter((m) => m);
  const mattermostUsersStatus = await mattermost.getMattermostUsersStatus(
    ids as string[],
  );

  for (const status of mattermostUsersStatus) {
    await db
      .updateTable("mattermost_member_infos")
      .set({
        last_activity_at: status.last_activity_at
          ? new Date(status.last_activity_at)
          : null,
      })
      .where("mattermost_user_id", "=", status.user_id);
  }
}
