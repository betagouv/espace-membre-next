import { db } from "@/lib/kysely";

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

// Returns at most 2 users matching the email on primary_email, secondary_email
// or a linked dinum_emails row. Uses exact case-insensitive equality (not ILIKE,
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
        eb(fn("lower", ["secondary_email"]), "=", normalized),
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
    )
    .limit(2)
    .execute();
};
