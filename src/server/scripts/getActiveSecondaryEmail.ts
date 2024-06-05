import BetaGouv from "../betagouv";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { DBUser } from "@/models/dbUser/dbUser";
import { publicUserInfosToModel } from "@/models/mapper";
import { Member } from "@/models/member";
import * as utils from "@controllers/utils";
import knex from "@db";

export async function getActiveSecondaryEmailsForUsers() {
    const users = (await getAllUsersInfo()).map((user) =>
        publicUserInfosToModel(user)
    );
    const activeUsers = users.filter((user) => !utils.checkUserIsExpired(user));
    const dbUsers: DBUser[] = await knex("users")
        .whereNotNull("secondary_email")
        .whereIn(
            "username",
            activeUsers.map((user) => user.username)
        );
    dbUsers.forEach((user) => {
        console.log(user.secondary_email);
    });
}

getActiveSecondaryEmailsForUsers();
