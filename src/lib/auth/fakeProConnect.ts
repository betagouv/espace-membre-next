import { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import {
  findUsersByLoginEmail,
  normalizeLoginEmail,
} from "@/lib/auth/findUsersByLoginEmail";

export const FAKE_PROCONNECT_PROVIDER_ID = "fake-proconnect";

// [IMPORTANT] development only : the ProConnect integration environment is not
// reachable from a local setup, so `next dev` gets a login that simulates what
// ProConnect returns (an email, nothing is checked).
// NODE_ENV is "production" for every built app (production, staging, review
// apps) : this can only be enabled by `next dev`.
// set FAKE_PROCONNECT_LOGIN=false to disable it locally.
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
  const dbUsers = await findUsersByLoginEmail(email);
  if (!email || dbUsers.length !== 1) {
    console.log(
      `Fake ProConnect: ${dbUsers.length} member(s) found for ${credentials?.email}`,
    );
    throw new Error("UnknownMember");
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
