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

// pour les comptes actifs en EMAIL_SUSPENDED avec un secondary_email
// reactive ou recréé l'email et le passe en ACTIVE
// todo: N8N
export async function recreateEmailIfUserActive() {
  const dbUsers = await getActiveUsers()
    .where("users.primary_email_status", "in", [
      EmailStatusCode.EMAIL_SUSPENDED,
      EmailStatusCode.EMAIL_DELETED,
    ])
    .where("users.secondary_email", "is not", null)
    .execute();
  for (const dbUser of dbUsers) {
    try {
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
          await patchMailbox({
            domain_name: DIMAIL_MAILBOX_DOMAIN,
            user_name: dbUser.primary_email.split("@")[0],
            data: {
              active: "yes",
            },
          });
          await db
            .updateTable("users")
            .set({
              primary_email: dbUser.primary_email,
              primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
            })
            .where("uuid", "=", dbUser.uuid)
            .execute();
        } else {
          console.log(
            `create DIMAIL email for ${dbUser.username} (${dbUser.primary_email})`,
          );
          // create new DIMAIL email account
          await createDimailMailboxForUser(dbUser.uuid);
        }
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(error.message);
      console.error(e);
      Sentry.captureException(e);
    }
  }
}
