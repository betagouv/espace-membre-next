import * as Sentry from "@sentry/node";

import { db } from "@/lib/kysely";
import { Domaine, EmailStatusCode } from "@/models/member";
import { patchMailbox } from "@/lib/dimail/client";
import * as createDimailMailboxWorker from "../queueing/workers/create-dimail-mailbox";
// allow tests (rewire) to override this function by exposing a mutable binding
let createDimailMailboxForUser =
  createDimailMailboxWorker.createDimailMailboxForUser;
import { getActiveUsers } from "@/lib/kysely/queries/users";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";

// The mailbox to reactivate : the primary email itself when it is a mailbox,
// the destination of the primary email when it is an alias to one of the
// member's mailboxes (a @beta.gouv.fr alias pointing to a @ext.beta.gouv.fr
// mailbox), else one of the member's mailboxes : current domain first, then
// disabled ones first. Rows removed from Dimail are ignored.
const liveMailboxes = (uuid: string) =>
  db
    .selectFrom("dinum_emails")
    .select("email")
    .where("user_id", "=", uuid)
    .where("type", "=", "mailbox")
    .where((eb) =>
      eb.or([eb("status", "is", null), eb("status", "!=", "deleted")]),
    );

export const getMailboxToReactivate = async (
  uuid: string,
  primaryEmail: string | null,
) => {
  if (primaryEmail) {
    const primaryRow = await db
      .selectFrom("dinum_emails")
      .select(["email", "type", "destination"])
      .where("user_id", "=", uuid)
      .where(({ eb, fn }) =>
        eb(fn("lower", ["email"]), "=", primaryEmail.toLowerCase()),
      )
      .where((eb) =>
        eb.or([eb("status", "is", null), eb("status", "!=", "deleted")]),
      )
      .executeTakeFirst();
    const target =
      primaryRow?.type === "mailbox"
        ? primaryRow.email
        : primaryRow?.type === "alias"
          ? primaryRow.destination
          : null;
    if (target) {
      const mailbox = await liveMailboxes(uuid)
        .where(({ eb, fn }) =>
          eb(fn("lower", ["email"]), "=", target.toLowerCase()),
        )
        .executeTakeFirst();
      if (mailbox) {
        return mailbox.email;
      }
    }
  }
  const mailbox = await liveMailboxes(uuid)
    .orderBy((eb) =>
      eb
        .case()
        .when("email", "ilike", `%@${DIMAIL_MAILBOX_DOMAIN}`)
        .then(0)
        .else(1)
        .end(),
    )
    .orderBy((eb) =>
      eb.case().when("status", "=", "disabled").then(0).else(1).end(),
    )
    .orderBy("email")
    .executeTakeFirst();
  return mailbox?.email ?? null;
};

// pour les comptes actifs en EMAIL_SUSPENDED/EMAIL_DELETED avec un secondary_email
// reactive ou recréé l'email et le passe en ACTIVE
// todo: N8N
export async function recreateEmailIfUserActive() {
  console.log("recreateEmailIfUserActive");
  const dbUsers = await getActiveUsers()
    .where("users.primary_email_status", "in", [
      EmailStatusCode.EMAIL_SUSPENDED,
    ])
    .where("users.secondary_email", "is not", null)
    .where("users.domaine", "!=", Domaine.ATTRIBUTAIRE)
    .execute()
    // one row per open mission
    .then((rows) => [...new Map(rows.map((row) => [row.uuid, row])).values()]);
  console.log(`recreateEmailIfUserActive: ${dbUsers.length} accounts`);
  for (const dbUser of dbUsers) {
    try {
      console.log(`recreate email for ${dbUser.username}`);
      // an existing mailbox is reactivated, even when the primary email is
      // elsewhere (the status follows the mailbox) : a new one is only
      // created for a member who has none
      const mailbox = await getMailboxToReactivate(
        dbUser.uuid,
        dbUser.primary_email,
      );
      if (mailbox) {
        console.log(
          `set DIMAIL email imap_active for ${dbUser.username} (${mailbox})`,
        );
        const [userName, domainName] = mailbox.split("@");
        const { success } = await patchMailbox({
          domain_name: domainName,
          user_name: userName,
          data: {
            imap_active: "yes",
          },
        });
        if (!success) {
          throw new Error(`could not reactivate ${mailbox}`);
        }
        await db
          .updateTable("users")
          .set({
            primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
            primary_email_status_updated_at: new Date(),
          })
          .where("uuid", "=", dbUser.uuid)
          .execute();
      } else {
        console.log(`create DIMAIL email for ${dbUser.username}`);
        await createDimailMailboxForUser(dbUser.uuid);
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(
        `recreateEmailIfUserActive for ${dbUser.username} error : ${error.message}`,
      );
      Sentry.captureException(e);
    }
  }
}
