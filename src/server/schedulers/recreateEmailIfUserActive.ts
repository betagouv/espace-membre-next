import * as Sentry from "@sentry/node";

import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";
import { patchMailbox } from "@/lib/dimail/client";
import { getDimailEmail } from "@/lib/kysely/queries/dimail";
import * as createDimailMailboxWorker from "../queueing/workers/create-dimail-mailbox";
// allow tests (rewire) to override this function by exposing a mutable binding
let createDimailMailboxForUser =
  createDimailMailboxWorker.createDimailMailboxForUser;
import { getActiveUsers } from "@/lib/kysely/queries/users";

// pour les comptes actifs en EMAIL_SUSPENDED/EMAIL_DELETED avec un secondary_email
// reactive ou recréé l'email et le passe en ACTIVE
// todo: N8N
export async function recreateEmailIfUserActive() {
  console.log("recreateEmailIfUserActive");
  const dbUsers = await getActiveUsers()
    .where("users.primary_email_status", "in", [
      EmailStatusCode.EMAIL_SUSPENDED,
      EmailStatusCode.EMAIL_DELETED,
    ])
    .where("users.secondary_email", "is not", null)
    .execute();
  console.log(`recreateEmailIfUserActive: ${dbUsers.length} accounts`);
  for (const dbUser of dbUsers) {
    try {
      if (!dbUser.primary_email) {
        return;
      }
      console.log(
        `recreate email for ${dbUser.username} (${dbUser.primary_email})`,
      );
      if (dbUser.primary_email) {
        // if in dinum_emails
        const isDimailEmail = await getDimailEmail(dbUser.primary_email);
        if (isDimailEmail) {
          console.log(
            `set DIMAIL email active for ${dbUser.username} (${dbUser.primary_email})`,
          );
          // await patchMailbox({
          //   domain_name: DIMAIL_MAILBOX_DOMAIN,
          //   user_name: dbUser.primary_email.split("@")[0],
          //   data: {
          //     active: "yes",
          //   },
          // });
          await db
            .updateTable("users")
            .set({
              primary_email: dbUser.primary_email,
              primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
              primary_email_status_updated_at: new Date(),
            })
            .where("uuid", "=", dbUser.uuid)
            .execute();
        } else {
          // todo: should we create emails for public_sector ?
          console.log(
            `create DIMAIL email for ${dbUser.username} (${dbUser.primary_email})`,
          );
          // create new DIMAIL email account
          await createDimailMailboxForUser(dbUser.uuid);
        }
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.log(
        `recreateEmailIfUserActive for ${dbUser.username} error : ${error.message}`,
      );
      Sentry.captureException(e);
    }
  }
}
