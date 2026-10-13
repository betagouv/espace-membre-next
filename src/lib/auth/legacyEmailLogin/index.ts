// Temporary magic link login, kept for the migration of existing members to
// ProConnect + MFA. See README.md in this folder to remove it.
export { getLegacyEmailLoginConfig, isLegacyEmailLoginEnabled } from "./config";
export type { LegacyEmailLoginMode } from "./config";
export {
  canUseLegacyEmailLogin,
  getLegacyEmailLoginException,
  PROCONNECT_MFA_LOGIN_EVENT,
} from "./eligibility";
export {
  findUsersBySecondaryEmail,
  legacyEmailLoginAdapterMethods,
} from "./adapter";
export {
  LEGACY_EMAIL_PROVIDER_ID,
  legacyEmailLoginProviders,
} from "./provider";
export {
  checkLegacyEmailLoginAllowed,
  checkLegacyEmailLoginRateLimit,
} from "./signIn";
export { sendLegacyEmailLoginReminders } from "./reminder";
