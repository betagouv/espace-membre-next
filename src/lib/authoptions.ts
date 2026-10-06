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
import { getJwtTokenForUser } from "@/lib/session";
import {
  findUsersByLoginEmail,
  normalizeLoginEmail,
} from "@/lib/auth/findUsersByLoginEmail";
import {
  fakeProConnectProvider,
  isFakeProConnectEnabled,
} from "@/lib/auth/fakeProConnect";

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
          acr_values: "eidas1",
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
          const dbUsers = await findUsersByLoginEmail(userinfo?.email);
          if (dbUsers.length !== 1) {
            console.log(
              `ProConnect: ${dbUsers.length} member(s) found for ${userinfo?.email}`,
            );
            throw new Error("UnknownMember");
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
          if (!decoded["uuid"]) {
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
  callbacks: {
    async signIn({ user, account }) {
      if (user.id) {
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
        const loginProvider =
          account?.provider === "proconnect" ? "proconnect" : "email";
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
