import * as Sentry from "@sentry/node";

import { createEmail } from "../controllers/usersController/createEmailForUser";
import { getActiveUsers } from "../db/dbUser";
import { DBUser, DBUserPublic, EmailStatusCode } from "@/models/dbUser";
import betagouv from "@betagouv";
import db from "@db";

export async function recreateEmailIfUserActive() {
    const activeUsers: DBUserPublic[] = await getActiveUsers();
    const dbUsers: DBUser[] = await db("users")
        .whereIn(
            "username",
            activeUsers.map((user) => user.username)
        )
        .where({
            primary_email_status: EmailStatusCode.EMAIL_DELETED,
        })
        .whereNotNull("secondary_email");
    for (const dbUser of dbUsers) {
        try {
            await createEmail(dbUser.username, "Secretariat cron");
            console.log(`Create email for ${dbUser.username}`);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    }
}
