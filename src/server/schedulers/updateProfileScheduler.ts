import ejs from "ejs";

import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import * as mattermost from "@/lib/mattermost";
import { memberBaseInfoToModel } from "@/models/mapper";
import BetaGouv from "@betagouv";
import * as utils from "@controllers/utils";
import { sleep } from "@controllers/utils";

export async function sendMessageToActiveUsersWithoutSecondaryEmail() {
    const allMattermostUsers = await mattermost.getUserWithParams();
    const allMattermostUsersEmails = allMattermostUsers.map(
        (mattermostUser) => mattermostUser.email
    );
    const users = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user)
    );
    const activeUsers = users.filter((user) => !utils.checkUserIsExpired(user));
    const concernedUsers = users.filter(
        (user) => !user.secondary_email && user.primary_email
    );

    const concernedUserWithMattermostUsers = concernedUsers.map((user) => {
        const index = allMattermostUsersEmails.indexOf(user.primary_email!);
        return {
            userInfos: user,
            mattermostUsername:
                index > -1 ? allMattermostUsers[index].username : undefined,
        };
    });

    for (const user of concernedUserWithMattermostUsers) {
        if (user.mattermostUsername) {
            try {
                const messageContent = await ejs.renderFile(
                    `./src/server/views/templates/emails/updateSecondaryEmail.ejs`,
                    {
                        user,
                    }
                );
                console.log(
                    `Message d'update de l'email secondaire envoyé à ${user.mattermostUsername}`
                );
                await BetaGouv.sendInfoToChat(
                    messageContent,
                    "secretariat",
                    user.mattermostUsername
                );
                await sleep(1000);
            } catch (e) {
                console.log(
                    `Erreur lors de l'envoie à ${user.mattermostUsername}`,
                    e
                );
            }
        }
    }
}
