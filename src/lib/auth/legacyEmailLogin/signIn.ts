import { canUseLegacyEmailLogin } from "./eligibility";
import { LEGACY_EMAIL_PROVIDER_ID } from "./provider";
import { checkRateLimit } from "./rateLimit";

// Only the initial login-form submission (`verificationRequest`) can be sprayed
// by an unauthenticated caller against arbitrary addresses at zero cost: it
// mails whoever is asked about and writes a token to the DB before the signIn
// callback returns. Redeeming the emailed link requires a real token from that
// inbox, so it is not rate-limited.
export const checkLegacyEmailLoginRateLimit = ({
  username,
  isVerificationRequest,
}: {
  username: string;
  isVerificationRequest: boolean;
}) => {
  if (!isVerificationRequest) {
    return;
  }
  const { allowed } = checkRateLimit(
    `login-request:${username}`,
    3,
    15 * 60_000,
  );
  if (!allowed) {
    console.log(`Too many login attempts for ${username}`);
    throw new Error("TooManyAttempts");
  }
};

// checked both when the link is requested and when it is redeemed: a member
// who migrated to ProConnect in between, or whose exception expired, is refused
export const checkLegacyEmailLoginAllowed = async ({
  provider,
  dbUser,
}: {
  provider: string | undefined;
  dbUser: { uuid: string; username: string; created_at: Date };
}) => {
  if (provider !== LEGACY_EMAIL_PROVIDER_ID) {
    return;
  }
  if (!(await canUseLegacyEmailLogin(dbUser))) {
    console.log(`Email login not allowed for ${dbUser.username}`);
    throw new Error("EmailLoginClosed");
  }
};
