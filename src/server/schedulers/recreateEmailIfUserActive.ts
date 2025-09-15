import * as Sentry from "@sentry/node";

import { createEmail } from "../controllers/usersController/createEmailForUser";
import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";

export async function recreateEmailIfUserActive() {
  // todo: reactivate DIMAIL email
  //---
  // const missions = await db
  //   .selectFrom("missions")
  //   .selectAll()
  //   .where((eb) => eb.or([eb("end", ">", new Date()), eb("end", "is", null)]))
  //   .execute();
  // const dbUsers = await db
  //   .selectFrom("users")
  //   .selectAll()
  //   .where(
  //     "username",
  //     "in",
  //     missions.map((m) => m.user_id),
  //   )
  //   .where("primary_email_status", "=", EmailStatusCode.EMAIL_DELETED)
  //   .where("secondary_email", "is not", null)
  //   .execute();
  // for (const dbUser of dbUsers) {
  //   try {
  //     await createEmail(dbUser.username, "Secretariat cron");
  //     console.log(`Recreate email for ${dbUser.username}`);
  //   } catch (e) {
  //     console.error(e);
  //     Sentry.captureException(e);
  //   }
  // }
}
