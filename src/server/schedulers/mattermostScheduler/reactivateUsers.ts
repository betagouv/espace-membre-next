import * as mattermost from "@/lib/mattermost";
import config from "@/server/config";
import {
    getAllDBUsersAndMission,
    getAllUsersPublicInfo,
} from "@/server/db/dbUser";
import betagouv from "@betagouv";
import * as utils from "@controllers/utils";

export async function reactivateUsers() {
    const inactiveMattermostUsers =
        await mattermost.getInactiveMattermostUsers();

    const users = await getAllDBUsersAndMission();
    const currentUsers = users.filter((x) => !utils.checkUserIsExpired(x));

    const currentUsersEmails = currentUsers.map(
        (user) => `${user.username}@${config.domain}`
    );
    const mattermostUsersToReactivate = inactiveMattermostUsers.filter(
        ({ email }) => currentUsersEmails.find((userMail) => userMail === email)
    );

    for (const member of mattermostUsersToReactivate) {
        await mattermost.activeUsers(member.id);
    }
    return mattermostUsersToReactivate;
}
