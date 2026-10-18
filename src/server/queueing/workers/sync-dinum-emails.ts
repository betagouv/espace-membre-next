import * as Sentry from "@sentry/node";

import { getAllMailboxes, getAllAliases } from "@/lib/dimail/client";
import { db } from "@/lib/kysely";
import { isLive } from "@/lib/kysely/queries/dimail";
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
// above this share of the live rows of a type disappearing at once, the Dimail
// answer is considered incomplete and nothing is marked deleted
const MAX_DELETED_SHARE = 0.2;

const markMissingRowsDeleted = async ({
  domain,
  isAlias,
  knownEmails,
}: {
  domain: string;
  isAlias: boolean;
  knownEmails: string[];
}) => {
  const label = `sync dinum_emails table for ${domain} (${isAlias ? "aliases" : "mailboxes"})`;
  if (!knownEmails.length) {
    console.log(`${label}: empty Dimail list, deleted rows not updated`);
    return;
  }
  const known = knownEmails.map((email) => email.toLowerCase());
  const liveRows = () =>
    db
      .selectFrom("dinum_emails")
      .where("email", "ilike", `%@${domain}`)
      .where((eb) =>
        isAlias
          ? eb("type", "=", "alias")
          : eb.or([eb("type", "is", null), eb("type", "!=", "alias")]),
      )
      .where(isLive);
  const [{ live }, { missing }] = await Promise.all([
    liveRows()
      .select((eb) => eb.fn.countAll<number>().as("live"))
      .executeTakeFirstOrThrow(),
    liveRows()
      .where((eb) => eb(eb.fn("lower", ["email"]), "not in", known))
      .select((eb) => eb.fn.countAll<number>().as("missing"))
      .executeTakeFirstOrThrow(),
  ]);
  if (Number(live) && Number(missing) / Number(live) > MAX_DELETED_SHARE) {
    const message = `${label}: ${missing}/${live} rows missing from Dimail, deletion skipped`;
    console.error(message);
    Sentry.captureMessage(message);
    return;
  }
  const deleted = await db
    .updateTable("dinum_emails")
    .set({
      status: "deleted",
      updated_at: new Date(),
      // a lock set before the deletion would otherwise keep the address on
      // that member if Dimail ever gives it to someone else
      user_id_locked_by: null,
      user_id_locked_at: null,
    })
    .where("email", "ilike", `%@${domain}`)
    .where((eb) =>
      isAlias
        ? eb("type", "=", "alias")
        : eb.or([eb("type", "is", null), eb("type", "!=", "alias")]),
    )
    .where(isLive)
    .where((eb) => eb(eb.fn("lower", ["email"]), "not in", known))
    .executeTakeFirst();
  console.log(
    `${label}: ${Number(deleted.numUpdatedRows)} rows marked deleted`,
  );
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

  if (allAccounts.length) {
    await db
      .insertInto("dinum_emails")
      .values(allAccounts)
      .onConflict((c) =>
        c.column("email").doUpdateSet({
          status: (eb) => eb.ref("excluded.status"),
          destination: (eb) => eb.ref("excluded.destination"),
          type: (eb) => eb.ref("excluded.type"),
          updated_at: (eb) => eb.fn("now"),
          // a row attached to a member by an admin keeps that member : the
          // username/primary email heuristic above can pick the wrong one
          user_id: (eb) =>
            eb
              .case()
              .when("dinum_emails.user_id_locked_by", "is not", null)
              .then(eb.ref("dinum_emails.user_id"))
              .else(eb.ref("excluded.user_id"))
              .end(),
        }),
      )
      .execute();
  }

  // only on a successful read: a failed call would mark every row of that type deleted
  if (mailboxesResult.success) {
    await markMissingRowsDeleted({
      domain,
      isAlias: false,
      knownEmails: mailboxes.map((m) => m.email),
    });
  }
  if (aliasesResult.success) {
    await markMissingRowsDeleted({
      domain,
      isAlias: true,
      knownEmails: aliases.map((a) => a.email),
    });
  }
}

// the status follows the mailbox, even when the primary email is an administration address
const enabledMailboxOwners = () =>
  db
    .selectFrom("dinum_emails")
    .select("user_id")
    .where("user_id", "is not", null)
    .where("type", "=", "mailbox")
    .where("status", "=", "enabled");

const setEmailsActives = async () => {
  const updateUsersEmailsActive = await db
    .updateTable("users")
    .set("primary_email_status", EmailStatusCode.EMAIL_ACTIVE)
    .where("primary_email_status", "=", EmailStatusCode.EMAIL_SUSPENDED)
    .where("uuid", "in", enabledMailboxOwners())
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
  const updateUsersEmailSuspended = await db
    .updateTable("users")
    .set("primary_email_status", EmailStatusCode.EMAIL_SUSPENDED)
    .where("primary_email_status", "=", EmailStatusCode.EMAIL_ACTIVE)
    .where(
      "uuid",
      "in",
      db
        .selectFrom("dinum_emails")
        .select("user_id")
        .where("user_id", "is not", null)
        .where("type", "=", "mailbox")
        .where("status", "=", "disabled"),
    )
    .where("uuid", "not in", enabledMailboxOwners())
    .returning("username")
    .execute();
  console.log(
    `Users emails marked as suspended: ${updateUsersEmailSuspended.length}`,
  );
  console.log(
    updateUsersEmailSuspended.map((r) => ` - ${r.username}`).join("\n"),
  );
};

export { setEmailsActives, setEmailsSuspendeds };

export const startSync = async () => {
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
