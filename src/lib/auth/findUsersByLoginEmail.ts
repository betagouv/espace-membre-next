import { db } from "@/lib/kysely";
import { isLive } from "@/lib/kysely/queries/dimail";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const normalizeLoginEmail = (
  email: string | null | undefined,
): string | null => {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !EMAIL_REGEX.test(normalized)) {
    return null;
  }
  return normalized;
};

// former Dimail domain, still synced in dinum_emails. These addresses will be
// migrated to prenom.nom.ext@beta.gouv.fr : ProConnect must be used with the
// member's @beta.gouv.fr alias, not with this domain.
export const LEGACY_EXT_DOMAIN = "ext.beta.gouv.fr";

export const isLegacyExtEmail = (email: string | null | undefined) =>
  !!normalizeLoginEmail(email)?.endsWith(`@${LEGACY_EXT_DOMAIN}`);

// Returns at most 2 users matching the email on primary_email or a linked
// dinum_emails row (mailbox or alias). secondary_email (personal email) is
// deliberately NOT a login identifier : members log in with ProConnect using
// their primary email only. Uses exact case-insensitive equality (not ILIKE,
// where `_` and `%` are wildcards) and rejects empty/invalid emails, which would
// otherwise match rows storing ''. Callers must refuse login unless exactly one
// user is returned.
export const findUsersByLoginEmail = async (
  email: string | null | undefined,
) => {
  const normalized = normalizeLoginEmail(email);
  if (!normalized) {
    return [];
  }
  return db
    .selectFrom("users")
    .selectAll()
    .where(({ eb, fn }) =>
      eb.or([
        eb(fn("lower", ["primary_email"]), "=", normalized),
        eb(
          "users.uuid",
          "in",
          eb
            .selectFrom("dinum_emails")
            .select("user_id")
            .where(({ eb, fn }) =>
              eb(fn("lower", ["email"]), "=", normalized).and(
                "user_id",
                "is not",
                null,
              ),
            )
            .where(isLive),
        ),
      ]),
    )
    .limit(2)
    .execute();
};

// users already using this email in any field (primary, secondary or dinum_emails)
export const findUsersUsingEmail = async (
  email: string | null | undefined,
  { excludeUserUuid }: { excludeUserUuid?: string } = {},
) => {
  const normalized = normalizeLoginEmail(email);
  if (!normalized) {
    return [];
  }
  let query = db
    .selectFrom("users")
    .select(["users.uuid", "users.username"])
    .where(({ eb, fn }) =>
      eb.or([
        eb(fn("lower", ["primary_email"]), "=", normalized),
        eb(fn("lower", ["secondary_email"]), "=", normalized),
        // a pending primary email already logs in with ProConnect
        eb(fn("lower", ["pending_primary_email"]), "=", normalized).and(
          "pending_primary_email_expires_at",
          ">",
          new Date(),
        ),
        eb(
          "users.uuid",
          "in",
          eb
            .selectFrom("dinum_emails")
            .select("user_id")
            .where(({ eb, fn }) =>
              eb(fn("lower", ["email"]), "=", normalized).and(
                "user_id",
                "is not",
                null,
              ),
            ),
        ),
      ]),
    );
  if (excludeUserUuid) {
    query = query.where("users.uuid", "!=", excludeUserUuid);
  }
  return query.execute();
};
