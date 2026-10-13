import {
  isLegacyExtEmail,
  LEGACY_EXT_DOMAIN,
} from "@/lib/auth/findUsersByLoginEmail";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";
import { db } from "@/lib/kysely";
import { getActiveUsers } from "@/lib/kysely/queries/users";
import { isPublicServiceEmail } from "@/lib/utils";

import { PROCONNECT_MFA_LOGIN_EVENT } from "./eligibility";

export type MigrationCategory =
  // can log in with ProConnect as is
  | "beta"
  | "public_service"
  | "other_with_beta_alias"
  | "ext_with_beta_alias"
  // cannot until the ext addresses are migrated to .ext@
  | "ext_without_alias"
  // no address ProConnect would accept : at risk at the cutoff
  | "no_primary_email"
  | "other";

const hasMainDomainAddress = (dinumEmails: string[]) =>
  dinumEmails.some(
    (email) =>
      email.endsWith(`@${DIMAIL_MAILBOX_DOMAIN}`) &&
      !email.endsWith(`@${LEGACY_EXT_DOMAIN}`),
  );

export const categorizeForMigration = async ({
  primary_email,
  dinumEmails,
}: {
  primary_email: string | null;
  dinumEmails: string[];
}): Promise<MigrationCategory> => {
  const email = primary_email?.trim().toLowerCase() || null;
  if (!email) {
    return "no_primary_email";
  }
  // checked first : isPublicServiceEmail accepts every *.gouv.fr domain
  if (isLegacyExtEmail(email)) {
    return hasMainDomainAddress(dinumEmails)
      ? "ext_with_beta_alias"
      : "ext_without_alias";
  }
  if (email.endsWith(`@${DIMAIL_MAILBOX_DOMAIN}`)) {
    return "beta";
  }
  if (await isPublicServiceEmail(email)) {
    return "public_service";
  }
  return hasMainDomainAddress(dinumEmails) ? "other_with_beta_alias" : "other";
};

// read only : active members who never logged in with ProConnect + MFA
export async function reportLegacyEmailLoginPopulation() {
  const users = await getActiveUsers()
    .clearSelect()
    .select(["users.uuid", "users.username", "users.primary_email"])
    .distinct()
    .where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom("user_events")
            .select("user_events.uuid")
            .whereRef("user_events.user_id", "=", "users.uuid")
            .where("user_events.field_id", "=", PROCONNECT_MFA_LOGIN_EVENT),
        ),
      ),
    )
    .execute();
  const dinumEmails = await db
    .selectFrom("dinum_emails")
    .select(["user_id", "email"])
    .where("user_id", "is not", null)
    .execute();
  const dinumEmailsByUser = new Map<string, string[]>();
  for (const row of dinumEmails) {
    const list = dinumEmailsByUser.get(row.user_id!) || [];
    list.push(row.email.toLowerCase());
    dinumEmailsByUser.set(row.user_id!, list);
  }

  const byCategory: Record<string, string[]> = {};
  for (const user of users) {
    const category = await categorizeForMigration({
      primary_email: user.primary_email,
      dinumEmails: dinumEmailsByUser.get(user.uuid) || [],
    });
    (byCategory[category] ||= []).push(user.username);
  }
  return { total: users.length, byCategory };
}
