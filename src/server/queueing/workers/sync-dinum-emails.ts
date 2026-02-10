import { getAllMailboxes, getAllAliases } from "@/lib/dimail/client";
import { db } from "@/lib/kysely";
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

  const allAccounts = await pAll(
    //  exclude duplicate emails
    [...mailboxes, ...aliases]
      .filter(
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

export async function syncDinumEmails(job: PgBoss.Job<void>) {
  console.log("start job sync dinum_emails tables");
  await syncDinumEmailsJob(DIMAIL_MAILBOX_DOMAIN);
  await syncDinumEmailsJob("ext.beta.gouv.fr"); // legacy, todo remove
  return "ok";
}
