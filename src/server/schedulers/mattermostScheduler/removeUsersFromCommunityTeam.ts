import { MattermostUser } from "@/lib/mattermost";
import * as mattermost from "@/lib/mattermost";
import {
    DBUser,
    DBUserPublic,
    DBUserPublicAndMission,
} from "@/models/dbUser/dbUser";
import { Member } from "@/models/member";
import config from "@/server/config";
import {
    getAllDBUsersAndMission,
    getAllUsersPublicInfo,
} from "@/server/db/dbUser";
import betagouv from "@betagouv";
import * as utils from "@controllers/utils";
import knex from "@db";

export async function removeUsersFromCommunityTeam(
    optionalUsers?: DBUserPublicAndMission[],
    checkAll = true
) {
    // Removed users referenced on github but expired for more than 3 months
    let users = optionalUsers;
    console.log("Start function remove users from community team");
    if (!users) {
        users = await getAllDBUsersAndMission();
        users = checkAll
            ? utils.getExpiredUsers(users, 3 * 30)
            : utils.getExpiredUsersForXDays(users, 3 * 30);
    }
    const dbUsers: DBUser[] = await knex("users").whereNotNull(
        "secondary_email"
    );
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
                const mattermostUsers: MattermostUser[] =
                    await mattermost.searchUsers({
                        term: user.username,
                        team_id: config.mattermostTeamId,
                    });
                if (!mattermostUsers.length || mattermostUsers.length > 1) {
                    console.error(
                        `Cannot find mattermost user for ${user.username} : ${mattermostUsers.length} found`
                    );
                    return;
                }
                const res = await mattermost.removeUserFromTeam(
                    mattermostUsers[0].id,
                    config.mattermostTeamId
                );
                console.log(
                    `User ${user.username} with mattermost username ${mattermostUsers[0].username} has been removed from community`
                );
                return res;
            } catch (err) {
                throw new Error(
                    `Error while removing user ${user.username} from community team : ${err}`
                );
            }
        })
    );
    return results;
}
