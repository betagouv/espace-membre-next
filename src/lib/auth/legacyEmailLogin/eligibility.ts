import { db } from "@/lib/kysely";

import { getLegacyEmailLoginConfig } from "./config";

// written by the signIn callback (authoptions.ts) on every ProConnect login,
// which always requires MFA
export const PROCONNECT_MFA_LOGIN_EVENT = "login.proconnect_mfa";

// support exception : the user_events `date` column holds the expiry date
export const EXCEPTION_EVENT = "legacy_email_login.allowed_until";

const getEventDates = async (userUuid: string) => {
  const events = await db
    .selectFrom("user_events")
    .select(["field_id", "date"])
    .where("user_id", "=", userUuid)
    .where("field_id", "in", [PROCONNECT_MFA_LOGIN_EVENT, EXCEPTION_EVENT])
    .execute();
  const dateOf = (fieldId: string) =>
    events.find((e) => e.field_id === fieldId)?.date ?? null;
  return {
    mfaLoginAt: dateOf(PROCONNECT_MFA_LOGIN_EVENT),
    exceptionUntil: dateOf(EXCEPTION_EVENT),
  };
};

export const getLegacyEmailLoginException = async (userUuid: string) => {
  const { exceptionUntil } = await getEventDates(userUuid);
  return exceptionUntil && exceptionUntil > new Date() ? exceptionUntil : null;
};

// once migrated to ProConnect + MFA, the magic link closes, otherwise it would
// bypass the MFA
export const canUseLegacyEmailLogin = async (user: {
  uuid: string;
  created_at: Date;
}) => {
  const { mode, cutoffDate } = getLegacyEmailLoginConfig();
  if (mode === "off") {
    return false;
  }
  const { mfaLoginAt, exceptionUntil } = await getEventDates(user.uuid);
  if (exceptionUntil && exceptionUntil > new Date()) {
    return true;
  }
  if (mode === "exceptions") {
    return false;
  }
  return !!cutoffDate && user.created_at < cutoffDate && !mfaLoginAt;
};
