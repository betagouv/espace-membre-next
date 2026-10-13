import * as Sentry from "@sentry/node";

import {
  isLegacyExtEmail,
  LEGACY_EXT_DOMAIN,
} from "@/lib/auth/findUsersByLoginEmail";
import { isMemberReadyToLogin } from "@/lib/auth/loginStatus";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";
import { EMAIL_TYPES } from "@/lib/email/email";
import { db } from "@/lib/kysely";
import { getActiveUsers } from "@/lib/kysely/queries/users";
import { getBaseUrl } from "@/lib/url";
import { sendEmail } from "@/server/config/email.config";

import { getLegacyEmailLoginConfig } from "./config";
import { PROCONNECT_MFA_LOGIN_EVENT } from "./eligibility";

export const REMINDED_EVENT = "legacy_email_login.reminded";

// a cron run twice in the same week (retry, manual run) must not mail twice
const MIN_DAYS_BETWEEN_REMINDERS = 6;

// the address to give ProConnect. A legacy @ext.beta.gouv.fr primary email is
// refused by ProConnect : their Dimail alias on the main domain is used instead,
// if they have one.
const getProConnectLoginEmail = async (user: {
  uuid: string;
  primary_email: string | null;
}) => {
  if (!isLegacyExtEmail(user.primary_email)) {
    return user.primary_email;
  }
  const alias = await db
    .selectFrom("dinum_emails")
    .select("email")
    .where("user_id", "=", user.uuid)
    .where("email", "ilike", `%@${DIMAIL_MAILBOX_DOMAIN}`)
    .where("email", "not ilike", `%@${LEGACY_EXT_DOMAIN}`)
    .orderBy("email")
    .executeTakeFirst();
  return alias?.email ?? null;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

export async function sendLegacyEmailLoginReminders({
  now = new Date(),
}: { now?: Date } = {}) {
  const { mode, cutoffDate, endDate } = getLegacyEmailLoginConfig();
  if (mode !== "transition" || !cutoffDate || !endDate) {
    console.log(
      `legacy email login reminder skipped (mode ${mode}, end date ${endDate})`,
    );
    return { sent: 0 };
  }
  const remindedBefore = new Date(
    now.getTime() - MIN_DAYS_BETWEEN_REMINDERS * 24 * 3600 * 1000,
  );
  const users = await getActiveUsers()
    .clearSelect()
    .select([
      "users.uuid",
      "users.username",
      "users.fullname",
      "users.primary_email",
      "users.primary_email_status",
      "users.secondary_email",
    ])
    .distinct()
    .where("users.created_at", "<", cutoffDate)
    .where(({ eb, not, exists, selectFrom }) =>
      eb.and([
        not(
          exists(
            selectFrom("user_events")
              .select("user_events.uuid")
              .whereRef("user_events.user_id", "=", "users.uuid")
              .where("user_events.field_id", "=", PROCONNECT_MFA_LOGIN_EVENT),
          ),
        ),
        not(
          exists(
            selectFrom("user_events")
              .select("user_events.uuid")
              .whereRef("user_events.user_id", "=", "users.uuid")
              .where("user_events.field_id", "=", REMINDED_EVENT)
              .where("user_events.date", ">", remindedBefore),
          ),
        ),
      ]),
    )
    .execute();

  let sent = 0;
  let extWithoutAlias = 0;
  for (const user of users) {
    const toEmail = user.primary_email || user.secondary_email;
    if (!toEmail || !isMemberReadyToLogin(user)) {
      continue;
    }
    const loginEmail = await getProConnectLoginEmail(user);
    // nothing they can do before the migration of the ext addresses
    if (!loginEmail && isLegacyExtEmail(user.primary_email)) {
      extWithoutAlias++;
      continue;
    }
    try {
      await sendEmail({
        type: EMAIL_TYPES.EMAIL_LEGACY_LOGIN_REMINDER,
        toEmail: [toEmail],
        variables: {
          fullname: user.fullname,
          endDate: formatDate(endDate),
          loginEmail,
          loginUrl: `${getBaseUrl()}/login`,
          supportUrl: `${getBaseUrl()}/support`,
        },
      });
      await db
        .insertInto("user_events")
        .values({ field_id: REMINDED_EVENT, user_id: user.uuid, date: now })
        .onConflict((oc) =>
          oc.column("field_id").column("user_id").doUpdateSet({ date: now }),
        )
        .execute();
      sent++;
    } catch (error) {
      console.error(
        `legacy email login reminder failed for ${user.username}`,
        error,
      );
      Sentry.captureException(error);
    }
  }
  console.log(
    `legacy email login reminder: ${sent} sent / ${users.length} candidates, ${extWithoutAlias} ${LEGACY_EXT_DOMAIN} without alias skipped`,
  );
  return { sent };
}
