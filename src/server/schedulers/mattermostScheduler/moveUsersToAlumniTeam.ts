import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { MattermostUser } from "@/lib/mattermost";
import * as mattermost from "@/lib/mattermost";
import { memberBaseInfoToModel } from "@/models/mapper";
import { memberBaseInfoSchemaType } from "@/models/member";
import config from "@/server/config";
import betagouv from "@betagouv";
import * as utils from "@controllers/utils";

export async function moveUsersToAlumniTeam(
    optionalUsers?: memberBaseInfoSchemaType[],
    checkAll = false,
) {
    let users = optionalUsers;
    console.log("Start function move users to team alumni");
    if (!users) {
        users = (await getAllUsersInfo()).map((user) =>
            memberBaseInfoToModel(user),
        );
        users = checkAll
            ? utils.getExpiredUsers(users, 3)
            : utils.getExpiredUsersForXDays(users, 3);
    }

    const results = await Promise.all(
        users.map(async (user) => {
            try {
                const mattermostUsers: MattermostUser[] =
                    await mattermost.searchUsers({
                        term: user.username,
                    });
                if (!mattermostUsers.length || mattermostUsers.length > 1) {
                    console.error(
                        `Cannot find mattermost user for ${user.username} : ${mattermostUsers.length} found`,
                    );
                    return;
                }
                const res = await mattermost.addUserToTeam(
                    mattermostUsers[0].id,
                    config.mattermostAlumniTeamId,
                );
                console.log(
                    `User ${user.username} with mattermost username ${mattermostUsers[0].username} has been moved to alumni`,
                );
                return res;
            } catch (err) {
                throw new Error(
                    `Error while moving user ${user.username} to alumni team : ${err}`,
                );
            }
        }),
    );
    return results;
}
