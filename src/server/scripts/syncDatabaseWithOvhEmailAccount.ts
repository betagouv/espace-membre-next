import betagouv from "../betagouv";
import knex from "../db";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { EmailStatusCode } from "@/models/dbUser/dbUser";
import { memberBaseInfoToModel, userInfosToModel } from "@/models/mapper";
import { Member } from "@/models/member";

const syncDatabaseWithOvhEmailAccount = async () => {
    const users = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user)
    );
    const usernames: string[] = users.map((user) => user.username);
    const ovhAccounts: string[] = await betagouv.accounts();
    const usernamesWithoutOvhEmailAccount = usernames.filter(
        (username) => !ovhAccounts.includes(username)
    );
    const dbUsers = users.filter(
        (user) =>
            [
                EmailStatusCode.EMAIL_ACTIVE,
                EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
            ].includes(user.primary_email_status) &&
            usernamesWithoutOvhEmailAccount.includes(user.username)
    );
    console.log(
        "Will set primary_email_status to deleted for users :",
        dbUsers.map((user) => user.username)
    );
    if (process.env.APPLY_SYNC_DATABASE_WITH_OVH_EMAIL_ACOUNT) {
        await knex("users")
            .whereIn(
                "username",
                dbUsers.map((user) => user.username)
            )
            .whereIn("primary_email_status", [
                EmailStatusCode.EMAIL_ACTIVE,
                EmailStatusCode.EMAIL_ACTIVE_AND_PASSWORD_DEFINITION_PENDING,
            ])
            .update({
                primary_email_status: EmailStatusCode.EMAIL_DELETED,
            });
    }
};

syncDatabaseWithOvhEmailAccount();
