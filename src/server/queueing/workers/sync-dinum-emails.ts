import { getAllMailboxes, getAllAliases } from "@/lib/dimail/client";
import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";
import pAll from "p-all";
import PgBoss from "pg-boss";

const DIMAIL_MAILBOX_DOMAIN = process.env.DIMAIL_MAILBOX_DOMAIN || "some";

export const syncDinumEmailsTopic = "sync-dinum-emails";

export const getUserNameFromEmail = (email: string) =>
  email.replace(/(.*?)(\.ext)?@.*$/, "$1");

export const getUserIdByEmail = async (email: string) => {
  const query = db
    .selectFrom("users")
    .select("uuid")
    .where(({ eb }) =>
      eb.or([
        eb("primary_email", "=", email),
        eb("primary_email", "=", email.replace("\.ext@", "@")),
        eb("primary_email", "=", email.replace("@ext\.", "@")),
        eb("username", "=", getUserNameFromEmail(email)),
      ]),
    );
  const user = await query.executeTakeFirst();
  return (user && user.uuid) || null;
};
/**
 * update dinum_emails table from dimail
 */
export async function syncDinumEmailsJob(domain: string) {
  console.log(`sync dinum_emails table for ${domain}`);
  const mailboxesResult = await getAllMailboxes({
    domain_name: domain,
  });
  const aliasesResult = await getAllAliases({
    domain_name: domain,
  });

  const mailboxes =
    mailboxesResult.mailboxes?.map((m) => ({
      type: m.type,
      email: m.email,
      status: m.imap_active === "yes" ? "enabled" : "disabled",
      destination: null,
    })) || [];

  const aliases =
    aliasesResult.aliases?.map((m) => ({
      type: "alias",
      email: `${m.username}@${m.domain}`,
      destination: m.destination,
      status: "enabled",
    })) || [];

  const allAccounts = await pAll(
    //  exclude duplicate emails
    [...mailboxes, ...aliases]
      .filter(
        // uniques
        (account, idx, allAccounts) =>
          !allAccounts
            .slice(0, idx)
            .find((otherAccount) => otherAccount.email === account.email),
      )
      .map((account) => async () => ({
        ...account,
        user_id: await getUserIdByEmail(account.email),
      })),
    { concurrency: 1 },
  );

  console.log(
    `sync dinum_emails table for ${domain}: ${allAccounts.length} accounts`,
  );

  return db
    .insertInto("dinum_emails")
    .values(allAccounts)
    .onConflict((c) =>
      c.column("email").doUpdateSet({
        status: (eb) => eb.ref("excluded.status"),
        destination: (eb) => eb.ref("excluded.destination"),
        type: (eb) => eb.ref("excluded.type"),
        updated_at: (eb) => eb.fn("now"),
        user_id: (eb) => eb.ref("excluded.user_id"),
      }),
    )
    .execute();
}

const setEmailsActives = async () => {
  const emailsToMarkAsActive = await db
    .selectFrom("dinum_emails")
    .select(["user_id", "email"])
    .where("user_id", "is not", null)
    .where("type", "=", "mailbox")
    .where("status", "=", "enabled")
    .execute();

  const updateUsersEmailsActive = await db
    .updateTable("users")
    .set("primary_email_status", EmailStatusCode.EMAIL_ACTIVE)
    .where("primary_email_status", "=", EmailStatusCode.EMAIL_SUSPENDED)
    .where("primary_email", "like", "%@beta.gouv.fr")
    .where(
      "uuid",
      "in",
      emailsToMarkAsActive.map((r) => r.user_id),
    )
    .returning("username")
    .execute();

  console.log(
    `Users emails marked as active: ${updateUsersEmailsActive.length}`,
  );
  console.log(
    updateUsersEmailsActive.map((r) => ` - ${r.username}`).join("\n"),
  );
};

const setEmailsSuspendeds = async () => {
  const emailsToMarkAsSuspended = await db
    .selectFrom("dinum_emails")
    .select(["user_id", "email"])
    .where("user_id", "is not", null)
    .where("type", "=", "mailbox")
    .where("status", "=", "disabled")
    .execute();

  const updateUsersEmailSuspended = await db
    .updateTable("users")
    .set("primary_email_status", EmailStatusCode.EMAIL_SUSPENDED)
    .where("primary_email_status", "=", EmailStatusCode.EMAIL_ACTIVE)
    .where("primary_email", "like", "%@beta.gouv.fr")
    .where(
      "uuid",
      "in",
      emailsToMarkAsSuspended.map((r) => r.user_id),
    )
    .returning("username")
    .execute();
  console.log(
    `Users emails marked as suspended: ${updateUsersEmailSuspended.map((x) => x.username).length}`,
  );
  console.log(
    updateUsersEmailSuspended.map((r) => ` - ${r.username}`).join("\n"),
  );
};

const startSync = async () => {
  console.log("start job sync dinum_emails tables");
  await syncDinumEmailsJob(DIMAIL_MAILBOX_DOMAIN);
  await syncDinumEmailsJob("ext.beta.gouv.fr"); // legacy, todo remove
  await setEmailsSuspendeds();
  await setEmailsActives();
};

export async function syncDinumEmails(job: PgBoss.Job<void>) {
  console.log("start pgboss job sync dinum_emails tables");
  await startSync();
}

startSync();
