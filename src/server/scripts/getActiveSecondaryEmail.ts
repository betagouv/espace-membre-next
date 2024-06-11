import BetaGouv from "../betagouv";
import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import * as utils from "@controllers/utils";

export async function getActiveSecondaryEmailsForUsers() {
    const users = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user)
    );
    const activeUsers = users.filter((user) => !utils.checkUserIsExpired(user));
    const dbUsers = await db
        .selectFrom("users")
        .select("secondary_email")
        .where("secondary_email", "is not", "null")
        .where(
            "username",
            "in",
            activeUsers.map((user) => user.username)
        )
        .execute();
    dbUsers.forEach((user) => {
        console.log(user.secondary_email);
    });
}

getActiveSecondaryEmailsForUsers();
