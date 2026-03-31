import { db } from "@/lib/kysely";
import * as mattermost from "@/lib/mattermost";
import { MattermostMemberInfo } from "@/models/mattermostMemberInfo";

import config from "@/server/config";

const isSameUser = (
  mattermostUser: mattermost.MattermostUser,
  dbUser: {
    primary_email?: string | null;
    secondary_email?: string | null;
  },
) => {
  return (
    mattermostUser.email === dbUser.primary_email ||
    mattermostUser.email === dbUser.secondary_email
  );
};

export async function syncMattermostUserWithMattermostMemberInfosTable() {
  const mattermostUsers: mattermost.MattermostUser[] =
    await mattermost.getUserWithParams({
      in_team: config.mattermostTeamId,
      active: true,
    });
  const mattermostUserEmails: string[] = mattermostUsers.map(
    (user) => user.email,
  );

  const mattermostMemberInfos = await db
    .selectFrom("mattermost_member_infos")
    .select("username")
    .execute();
  console.log("Mattermost member infos length", mattermostMemberInfos.length);

  const knownUsernames = mattermostMemberInfos.map((m) => m.username);

  let dbUsersQuery = db
    .selectFrom("users")
    .where((eb) =>
      eb("secondary_email", "in", mattermostUserEmails).or(
        "primary_email",
        "in",
        mattermostUserEmails,
      ),
    )
    .selectAll();

  if (knownUsernames.length > 0) {
    dbUsersQuery = dbUsersQuery.where("username", "not in", knownUsernames);
  }

  const dbUsers = await dbUsersQuery.execute();

  const newEntries: MattermostMemberInfo[] = [];
  for (const dbUser of dbUsers) {
    const mattermostUser = mattermostUsers.find((mUser) =>
      isSameUser(mUser, dbUser),
    );
    if (mattermostUser) {
      newEntries.push({
        username: dbUser.username,
        mattermost_user_id: mattermostUser.id,
      });
    }
  }

  if (newEntries.length > 0) {
    await db.insertInto("mattermost_member_infos").values(newEntries).execute();
    console.log(
      `Ajouté ${newEntries.length} utilisateurs à la table mattermost: ${newEntries.map((e) => e.username).join(", ")}`,
    );
  }
}
