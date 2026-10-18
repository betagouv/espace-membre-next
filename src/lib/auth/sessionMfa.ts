import { Session } from "next-auth";

import {
  FAKE_PROCONNECT_PROVIDER_ID,
  isFakeProConnectEnabled,
} from "@/lib/auth/fakeProConnect";
import { hasRequiredProConnectAcr } from "@/lib/auth/proConnectAcr";
import { BusinessError } from "@/lib/error";

// The provider alone is not enough : sessions opened before MFA was required
// also say "proconnect", so the acr of their id_token is checked.
export const isMfaSession = (session: Session | null | undefined) =>
  !!session?.user &&
  // the fake provider only counts where it exists : a dev token signed with a
  // copied SESSION_SECRET must not pass elsewhere
  ((session.user.provider === FAKE_PROCONNECT_PROVIDER_ID &&
    isFakeProConnectEnabled()) ||
    (session.user.provider === "proconnect" &&
      hasRequiredProConnectAcr(session.user.id_token)));

export const assertMfaSession = (
  session: Session | null | undefined,
  action: string,
) => {
  if (!isMfaSession(session)) {
    throw new BusinessError(
      "proConnectRequired",
      `Reconnecte-toi avec ProConnect pour ${action}.`,
    );
  }
};
