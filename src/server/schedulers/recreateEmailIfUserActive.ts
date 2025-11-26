import * as Sentry from "@sentry/node";

import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";
import { patchMailbox } from "@/lib/dimail/client";
import { getDimailEmail } from "@/lib/kysely/queries/dimail";
import { createDimailMailboxForUser } from "../queueing/workers/create-dimail-mailbox";
import { getActiveUsers } from "@/lib/kysely/queries/users";

// pour les comptes actifs en EMAIL_SUSPENDED avec un secondary_email
// reactive ou recréé l'email et le passe en ACTIVE
export async function recreateEmailIfUserActive() {
  const dbUsers = await getActiveUsers()
    .where("users.primary_email_status", "=", EmailStatusCode.EMAIL_SUSPENDED)
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
          console.log(`Recreate email for ${dbUser.username}`);
          await createDimailMailboxForUser(dbUser.uuid);
        }
      }
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
    }
  }
}
