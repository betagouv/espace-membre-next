import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { MattermostUser } from "@/lib/mattermost";
import * as mattermost from "@/lib/mattermost";
import { memberBaseInfoToModel } from "@/models/mapper";
import { memberBaseInfoSchemaType } from "@/models/member";
import config from "@/server/config";
import * as utils from "@controllers/utils";

export async function removeUsersFromCommunityTeam(
  optionalUsers?: memberBaseInfoSchemaType[],
  checkAll = true,
) {
  // Removed users referenced on github but expired for more than 3 months
  let users = optionalUsers;
  console.log("Start function remove users from community team");
  if (!users) {
    users = (await getAllUsersInfo()).map((user) =>
      memberBaseInfoToModel(user),
    );
    users = checkAll
      ? utils.getExpiredUsers(users, 3 * 30)
      : utils.getExpiredUsersForXDays(users, 3 * 30);
  }
  const dbUsers = await db
    .selectFrom("users")
    .selectAll()
    .where("secondary_email", "is not", null)
    .execute();
  const concernedUsers = users.map((user) => {
    const dbUser = dbUsers.find((x) => x.username === user.username);
    if (dbUser) {
      return { ...user, ...{ toEmail: dbUser.secondary_email } };
    }
    return user;
  });
  const results = await Promise.all(
    concernedUsers.map(async (user) => {
      try {
        const mattermostUsers: MattermostUser[] = await mattermost.searchUsers({
          term: user.username,
          team_id: config.mattermostTeamId,
        });
        if (!mattermostUsers.length || mattermostUsers.length > 1) {
          console.error(
            `Cannot find mattermost user for ${user.username} : ${mattermostUsers.length} found`,
          );
          return;
        }
        const res = await mattermost.removeUserFromTeam(
          mattermostUsers[0].id,
          config.mattermostTeamId,
        );
        console.log(
          `User ${user.username} with mattermost username ${mattermostUsers[0].username} has been removed from community`,
        );
        return res;
      } catch (err) {
        throw new Error(
          `Error while removing user ${user.username} from community team : ${err}`,
        );
      }
    }),
  );
  return results;
}
