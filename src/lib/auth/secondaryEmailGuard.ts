import { Session } from "next-auth";

import { findUsersUsingEmail } from "@/lib/auth/findUsersByLoginEmail";
import { assertMfaSession } from "@/lib/auth/sessionMfa";
import { BusinessError } from "@/lib/error";

// While the email login exists, the secondary (personal) email is a login
// identifier : changing it from a magic link session would let whoever holds
// that session keep the account, and an email shared by two members makes
// both logins ambiguous. Resubmitting the same value (verify form) is allowed.
export const assertSecondaryEmailChangeAllowed = async ({
  session,
  userUuid,
  currentEmail,
  newEmail,
}: {
  session: Session | null | undefined;
  userUuid: string;
  currentEmail: string | null | undefined;
  newEmail: string | null | undefined;
}) => {
  const next = newEmail?.trim().toLowerCase() || null;
  const current = currentEmail?.trim().toLowerCase() || null;
  if (next === current) {
    return;
  }
  assertMfaSession(session, "modifier l'email secondaire");
  if (!next) {
    return;
  }
  const otherUsers = await findUsersUsingEmail(next, {
    excludeUserUuid: userUuid,
  });
  if (otherUsers.length) {
    throw new BusinessError(
      "emailAlreadyUsed",
      `L'email ${next} est déjà utilisé par un autre membre.`,
    );
  }
};
