import { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import {
  findUsersByLoginEmail,
  isLegacyExtEmail,
  isSecondaryEmailOfMember,
  normalizeLoginEmail,
} from "@/lib/auth/findUsersByLoginEmail";
import { findUsersByPendingPrimaryEmail } from "@/lib/auth/pendingPrimaryEmail";

export const FAKE_PROCONNECT_PROVIDER_ID = "fake-proconnect";

// [IMPORTANT] next dev only : NODE_ENV is "production" in every built app.
// FAKE_PROCONNECT_LOGIN=false disables it locally.
export const isFakeProConnectEnabled = () =>
  process.env.NODE_ENV === "development" &&
  process.env.FAKE_PROCONNECT_LOGIN !== "false";

// same member lookup as the real ProConnect provider (see authoptions.ts) :
// only the primary email or a linked Dimail address logs in, never the
// personal email. The signIn callback (expired member...) applies as well.
export const authorizeFakeProConnect = async (
  credentials: Record<string, string> | undefined,
): Promise<User> => {
  if (!isFakeProConnectEnabled()) {
    throw new Error("FakeProConnectDisabled");
  }
  const email = normalizeLoginEmail(credentials?.email);
  if (isLegacyExtEmail(email)) {
    throw new Error("ExtEmailNotAllowed");
  }
  let dbUsers = await findUsersByLoginEmail(email);
  if (dbUsers.length === 0) {
    dbUsers = await findUsersByPendingPrimaryEmail(email);
  }
  if (!email || dbUsers.length !== 1) {
    console.log(
      `Fake ProConnect: ${dbUsers.length} member(s) found for ${credentials?.email}`,
    );
    throw new Error(
      dbUsers.length === 0 && (await isSecondaryEmailOfMember(email))
        ? "SecondaryEmailNotAllowed"
        : "UnknownMember",
    );
  }
  return {
    id: dbUsers[0].username,
    uuid: dbUsers[0].uuid,
    name: dbUsers[0].fullname,
    email,
  } as User;
};

export const fakeProConnectProvider = CredentialsProvider({
  id: FAKE_PROCONNECT_PROVIDER_ID,
  name: "ProConnect simulé (développement)",
  credentials: {
    email: { label: "Email", type: "email" },
  },
  authorize: authorizeFakeProConnect,
});
