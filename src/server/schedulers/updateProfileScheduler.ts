import ejs from "ejs";

import { getAllUsersPublicInfo, getDBUserAndMission } from "../db/dbUser";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import * as mattermost from "@/lib/mattermost";
import {
    DBUser,
    DBUserPublic,
    DBUserWithEmailsAndMattermostUsername,
} from "@/models/dbUser/dbUser";
import { publicUserInfosToModel } from "@/models/mapper";
import BetaGouv from "@betagouv";
import * as utils from "@controllers/utils";
import { sleep } from "@controllers/utils";
import knex from "@db";

export async function sendMessageToActiveUsersWithoutSecondaryEmail() {
    const allMattermostUsers = await mattermost.getUserWithParams();
    const allMattermostUsersEmails = allMattermostUsers.map(
        (mattermostUser) => mattermostUser.email
    );
    const users = (await getAllUsersInfo()).map((user) =>
        publicUserInfosToModel(user)
    );
    const activeUsers = users.filter((user) => !utils.checkUserIsExpired(user));
    const concernedUsers: DBUser[] = await knex("users")
        .whereNull("secondary_email")
        .whereIn(
            "username",
            activeUsers.map((user) => user.username)
        );

    const concernedUserWithMattermostUsers = concernedUsers.map((user) => {
        const index = allMattermostUsersEmails.indexOf(user.primary_email);
        const githubUser = activeUsers.find(
            (ghUser) => ghUser.username === user.username
        );
        return {
            ...githubUser,
            primary_email: user.primary_email,
            secondary_email: user.secondary_email,
            communication_email: user.communication_email,
            mattermostUsername:
                index > -1 ? allMattermostUsers[index].username : undefined,
        };
    }) as DBUserWithEmailsAndMattermostUsername[];

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
