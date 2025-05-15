import * as Sentry from "@sentry/node";

import { createEmail } from "../controllers/usersController/createEmailForUser";
import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";

export async function recreateEmailIfUserActive() {
    const missions = await db
        .selectFrom("missions")
        .selectAll()
        .where((eb) =>
            eb.or([eb("end", ">", new Date()), eb("end", "is", null)])
        )
        .execute();
    const dbUsers = await db
        .selectFrom("users")
        .selectAll()
        .where(
            "username",
            "in",
            missions.map((m) => m.user_id)
        )
        .where("primary_email_status", "=", EmailStatusCode.EMAIL_DELETED)
        .where("secondary_email", "is not", null)
        .execute();
    await db
        .updateTable('users')
        .set({
            primary_email_status: EmailStatusCode.EMAIL_RECREATION_WAITING
        })
        .where(
            "username",
            "in",
            dbUsers.map(user => user.username)
        )
        .execute();
}
