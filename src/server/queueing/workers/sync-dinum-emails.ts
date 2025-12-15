import { getAllMailboxes, getAllAliases } from "@/lib/dimail/client";
import { db } from "@/lib/kysely";
import PgBoss from "pg-boss";

const DIMAIL_MAILBOX_DOMAIN = process.env.DIMAIL_MAILBOX_DOMAIN || "some";

export const syncDinumEmailsTopic = "sync-dinum-emails";
/**
 * update dinum_emails table from dimail
 */
export async function syncDinumEmailsJob() {
  const mailboxesResult = await getAllMailboxes({
    domain_name: DIMAIL_MAILBOX_DOMAIN,
  });
  const aliasesResult = await getAllAliases({
    domain_name: DIMAIL_MAILBOX_DOMAIN,
  });

  const mailboxes =
    mailboxesResult.mailboxes?.map((m) => ({
      type: m.type,
      email: m.email,
      status: m.status,
      destination: null,
    })) || [];

  const aliases =
    aliasesResult.aliases?.map((m) => ({
      type: "alias",
      email: `${m.username}@${m.domain}`,
      destination: m.destination,
      status: "enabled",
    })) || [];

  // exclude duplicate emails
  const allAccounts = [...mailboxes, ...aliases].filter(
    (account, idx, allAccounts) =>
      !allAccounts
        .slice(0, idx)
        .find((otherAccount) => otherAccount.email === account.email),
  );

  console.info(`sync dinum_emails table: ${allAccounts.length} accounts`);

  return db
    .insertInto("dinum_emails")
    .values(allAccounts)
    .onConflict((c) =>
      c.column("email").doUpdateSet({
        status: (eb) => eb.ref("excluded.status"),
        destination: (eb) => eb.ref("excluded.destination"),
        type: (eb) => eb.ref("excluded.type"),
        updated_at: (eb) => eb.fn("now"),
      }),
    )
    .execute();
}

export async function syncDinumEmails(job: PgBoss.Job<void>) {
  console.info("start job sync dinum_emails table");
  await syncDinumEmailsJob();
  return "ok";
}

syncDinumEmailsJob();
