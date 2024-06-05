import { getAllUsersPublicInfo, getDBUserAndMission } from "../db/dbUser";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { DBUser, DBUserAndMission, DBUserPublic } from "@/models/dbUser/dbUser";
import { EmailStatusCode } from "@/models/dbUser/dbUser";
import { publicUserInfosToModel } from "@/models/mapper";
import { Member, memberPublicInfoSchemaType } from "@/models/member";
import config from "@/server/config";
import BetaGouv from "@betagouv";
import * as utils from "@controllers/utils";
import knex from "@db";

export async function setEmailExpired(
    optionalExpiredUsers?: memberPublicInfoSchemaType[]
) {
    let expiredUsers = optionalExpiredUsers;
    let dbUsers: memberPublicInfoSchemaType[] = [];
    if (!expiredUsers) {
        const users = (await getAllUsersInfo()).map((user) =>
            publicUserInfosToModel(user)
        );
        expiredUsers = users.filter((user) => {
            return utils.checkUserIsExpired(user, 30);
        });
        const today = new Date();
        const todayLess30days = new Date();
        todayLess30days.setDate(today.getDate() - 30);
        dbUsers = await knex("users")
            .whereIn(
                "username",
                expiredUsers.map((user) => user.username)
            )
            .andWhere({ primary_email_status: EmailStatusCode.EMAIL_SUSPENDED })
            .andWhere("primary_email_status_updated_at", "<", todayLess30days)
            .andWhere("primary_email", "NOT LIKE", `%@${config.domain}%`);
    }
    for (const user of dbUsers) {
        try {
            await knex("users")
                .where({
                    username: user.username,
                })
                .update({
                    primary_email_status: EmailStatusCode.EMAIL_EXPIRED,
                });
            console.log(
                `Email principal pour ${user.username} défini comme expiré`
            );
        } catch {
            console.log(
                `Erreur lors du changement de statut en expiré de l'email principal pour ${user.username}`
            );
        }
    }
}
