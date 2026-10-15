import jwt, { JwtPayload, VerifyOptions } from "jsonwebtoken";
import { NextAuthOptions, User } from "next-auth";
import { v4 as uuidv4 } from "uuid";

import customPostgresAdapter from "@/lib/pgAdpter";
import { db } from "@/lib/kysely";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import config from "@/lib/config";
import { getAdmin } from "@/server/config/admin.config";
import { checkUserIsExpired } from "@/lib/utils";
import {
  getJwtTokenForUser,
  isSessionLoginExpired,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session";
import {
  findUsersByLoginEmail,
  isLegacyExtEmail,
  normalizeLoginEmail,
} from "@/lib/auth/findUsersByLoginEmail";
import {
  FAKE_PROCONNECT_PROVIDER_ID,
  fakeProConnectProvider,
  isFakeProConnectEnabled,
} from "@/lib/auth/fakeProConnect";
import { isMemberReadyToLogin } from "@/lib/auth/loginStatus";
import { switchLegacyExtPrimaryEmail } from "@/lib/auth/switchLegacyExtPrimaryEmail";
import {
  findUsersByPendingPrimaryEmail,
  promotePendingPrimaryEmail,
} from "@/lib/auth/pendingPrimaryEmail";
import {
  hasRequiredProConnectAcr,
  proConnectAcrClaims,
} from "@/lib/auth/proConnectAcr";
// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import {
  checkLegacyEmailLoginAllowed,
  checkLegacyEmailLoginRateLimit,
  legacyEmailLoginProviders,
} from "@/lib/auth/legacyEmailLogin";

// never a username : no accounts row can match it
const REFUSED_PROCONNECT_LOGIN_ID = "refused-proconnect-login";

export type ProConnectProfile = {
  sub: string;
  email: string;
  given_name: string;
  usual_name: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
};

export const authOptions: NextAuthOptions = {
  adapter: customPostgresAdapter(),
  debug: process.env.NODE_ENV !== "production",
  providers: [
    // development only (never enabled in a built app) : see fakeProConnect.ts
    ...(isFakeProConnectEnabled() ? [fakeProConnectProvider] : []),
    // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
    ...legacyEmailLoginProviders(),
    {
      id: "proconnect",
      name: "Pro Connect",
      type: "oauth",
      version: "2.0",
      idToken: true,
      options: {
        clientId: process.env.PRO_CONNECT_ID || "",
        clientSecret: process.env.PRO_CONNECT_SECRET || "",
      },
      wellKnown:
        process.env.NEXT_PUBLIC_PRO_CONNECT_BASE_URL +
        "/api/v2/.well-known/openid-configuration",
      allowDangerousEmailAccountLinking: true,
      checks: ["nonce", "state"],
      authorization: {
        params: {
          scope: "openid uid given_name usual_name email",
          // double authentication required (essential acr) : see proConnectAcr.ts
          claims: proConnectAcrClaims(),
          nonce: uuidv4(),
          state: uuidv4(),
        },
      },
      client: {
        authorization_signed_response_alg: "RS256",
        id_token_signed_response_alg: "RS256",
        userinfo_encrypted_response_alg: "RS256",
        userinfo_signed_response_alg: "RS256",
        userinfo_encrypted_response_enc: "RS256",
      },

      userinfo: {
        request: async ({ tokens }) => {
          const userInfoRequest = await fetch(
            process.env.NEXT_PUBLIC_PRO_CONNECT_BASE_URL + "/api/v2/userinfo",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            },
          ).then((r) => r.text());
          const userinfo = jwt.decode(userInfoRequest) as ProConnectProfile;
          // an error thrown here reaches the login page as a generic
          // OAuthCallback : the refusal is raised by the signIn callback
          // instead, which forwards its message as the error code
          const refuse = (loginRefusal: string) => ({
            ...userinfo,
            email: normalizeLoginEmail(userinfo?.email) || "",
            id: REFUSED_PROCONNECT_LOGIN_ID,
            loginRefusal,
          });
          if (isLegacyExtEmail(userinfo?.email)) {
            console.log(`ProConnect: legacy ext address ${userinfo?.email}`);
            return refuse("ExtEmailNotAllowed");
          }
          let dbUsers = await findUsersByLoginEmail(userinfo?.email);
          // a new primary email waiting to be confirmed by this login
          if (dbUsers.length === 0) {
            dbUsers = await findUsersByPendingPrimaryEmail(userinfo?.email);
          }
          if (dbUsers.length !== 1) {
            console.log(
              `ProConnect: ${dbUsers.length} member(s) found for ${userinfo?.email}`,
            );
            return refuse("UnknownMember");
          }
          return {
            ...userinfo,
            email: normalizeLoginEmail(userinfo.email)!,
            id: dbUsers[0].username,
          };
        },
      },

      profile: async (profile) => {
        return {
          id: profile.id,
          uuid: profile.sub,
          name: `${profile.given_name} ${profile.usual_name}`,
          email: profile.email,
        } as User;
      },
    },
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  secret: config.secret,
  pages: {
    signIn: "/login",
    signOut: "/auth/signout",
    error: "/login",
  },
  jwt: {
    async encode({ secret, token }) {
      return getJwtTokenForUser(token);
    },
    async decode({ secret, token }) {
      if (token) {
        try {
          const decoded = jwt.verify(token, config.secret, {
            algorithm: "HS512",
          } as VerifyOptions);
          if (!decoded["uuid"] || isSessionLoginExpired(decoded["loginAt"])) {
            return null;
          }
          return decoded as JwtPayload;
        } catch (error) {
          console.log("Erreur lors de la décodification du token:", error);
          return null;
        }
      }
      return null;
    },
  },
  events: {
    // only emitted once the login succeeded (account resolved and linked, magic
    // link redeemed), unlike the signIn callback which can still be followed by
    // a refusal
    async signIn({ user, account, profile }) {
      if (!user?.id) {
        return;
      }
      // distinct from the former `login.proconnect`, recorded before MFA
      // was required
      // legacy-email-login: the "email" branch goes with src/lib/auth/legacyEmailLogin
      const loginProvider =
        account?.provider === "proconnect" ||
        account?.provider === FAKE_PROCONNECT_PROVIDER_ID
          ? "proconnect_mfa"
          : "email";
      const dbUser = await db
        .selectFrom("users")
        .select("uuid")
        .where("username", "=", user.id)
        .executeTakeFirst();
      if (!dbUser) {
        return;
      }
      await db
        .insertInto("user_events")
        .values({
          field_id: `login.${loginProvider}`,
          user_id: dbUser.uuid,
          date: new Date(),
        })
        .onConflict((oc) =>
          oc.column("field_id").column("user_id").doUpdateSet({
            date: new Date(),
          }),
        )
        .execute();
      if (loginProvider === "proconnect_mfa") {
        // the adapter user carries the stored email, not the one ProConnect
        // returned : the OAuth profile has it (the user, for the fake provider)
        const loginEmail = profile?.email ?? user.email;
        const promoted = await promotePendingPrimaryEmail({
          username: user.id,
          loginEmail,
        });
        if (!promoted) {
          await switchLegacyExtPrimaryEmail({ username: user.id, loginEmail });
        }
      }
    },
  },
  callbacks: {
    // legacy-email-login: drop `email` with src/lib/auth/legacyEmailLogin
    async signIn({ user, account, profile, email }) {
      const loginRefusal = (profile as { loginRefusal?: string } | undefined)
        ?.loginRefusal;
      if (loginRefusal) {
        throw new Error(loginRefusal);
      }
      if (user.id) {
        // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
        checkLegacyEmailLoginRateLimit({
          username: user.id,
          isVerificationRequest: !!email?.verificationRequest,
        });
        // the acr asked as essential must be read back from the id_token
        if (
          account?.provider === "proconnect" &&
          !hasRequiredProConnectAcr(account.id_token)
        ) {
          console.log(`ProConnect: acr without MFA refused for ${user.id}`);
          throw new Error("MfaRequired");
        }
        const dbUser = await getUserInfos({
          username: user.id,
          options: {
            withDetails: true,
          },
        });
        if (!dbUser) {
          console.log(
            `Il n'y a pas de fiche dans l'espace-membre pour cet email. Un membre de la communauté peut en créer une.`,
          );
          throw new Error("UnknownMember");
        }
        if (checkUserIsExpired(memberBaseInfoToModel(dbUser), 5)) {
          console.log(`Cannot login expired member ${user.id}`);
          throw new Error("ExpiredMember");
        }
        // a fiche not validated yet, or without its login address, cannot be
        // entered through a Dimail address linked to it by username
        if (!isMemberReadyToLogin(dbUser)) {
          console.log(
            `Cannot login member ${user.id}: status ${dbUser.primary_email_status}`,
          );
          throw new Error("MemberNotReady");
        }
        // legacy-email-login: remove with src/lib/auth/legacyEmailLogin
        await checkLegacyEmailLoginAllowed({
          provider: account?.provider,
          dbUser,
          requestedEmail: account?.providerAccountId,
          isVerificationRequest: !!email?.verificationRequest,
        });
        return true;
      } else {
        return false;
      }
    },
    async session({ session, token, user }) {
      let sessionWithId;
      if (session && session.user) {
        sessionWithId = {
          ...session,
          user: {
            ...session.user,
            name: session.user?.name || token.sub,
            id: token.sub,
            id_token: token.id_token,
            provider: token.provider,
            uuid: token.uuid,
            isAdmin: getAdmin().includes(token.sub || ""),
          },
        };
      }
      return sessionWithId || session;
    },
    async jwt({ token, user, account, profile, isNewUser, session }) {
      if (account) {
        token.loginAt = Math.floor(Date.now() / 1000);
        token.id_token = account.id_token;
        token.id = user?.id;
        token.uuid = user?.uuid;
        token.provider = account.provider;
        token.name = user?.name;
      }
      return token;
    },
  },
};
