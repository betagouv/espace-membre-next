import BetaGouv from "../betagouv";
import { getAllDBUsersAndMission, getAllUsersPublicInfo } from "../db/dbUser";
import { DBUser } from "@/models/dbUser/dbUser";
import { Member } from "@/models/member";
import * as utils from "@controllers/utils";
import knex from "@db";

export async function getActiveSecondaryEmailsForUsers() {
    const users = await getAllDBUsersAndMission();
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
