import { sql } from "kysely";
import { Account } from "next-auth";
import {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "next-auth/adapters";

import { findUsersByLoginEmail } from "@/lib/auth/findUsersByLoginEmail";
import { db } from "@/lib/kysely";

export default function customPostgresAdapter(): Adapter {
  try {
    const createUser = (
      user: Omit<AdapterUser, "id">,
    ): Promise<AdapterUser> => {
      console.log(
        "Unimplemented function! createUser in BetagouvAdapter. Session:",
      );
      return Promise.resolve(null as unknown as AdapterUser);
    };

    const getUser = async (id: string): Promise<AdapterUser | null> => {
      const user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", id)
        .executeTakeFirst();
      if (!user) {
        return null;
      }
      if (!user.primary_email && !user.secondary_email) {
        throw new Error(`User ${user.username} has no em`);
      }
      return {
        id: user.username,
        uuid: user.uuid,
        emailVerified: user.email_verified,
        email: (user.primary_email || user.secondary_email)!,
      };
    };

    const getUserByEmail = async (
      email: string,
    ): Promise<AdapterUser | null> => {
      const dbUsers = await findUsersByLoginEmail(email);
      if (dbUsers.length > 1) {
        console.log(`several db users match this email`);
        return null;
      }
      const dbUser = dbUsers[0];
      if (!dbUser || (!dbUser.primary_email && !dbUser.secondary_email)) {
        console.log(`db user does not exists`);
        return null;
      }
      return {
        ...dbUser,
        id: dbUser.username,
        emailVerified: dbUser.email_verified,
        email: (dbUser.primary_email || dbUser.secondary_email)!,
      };
    };

    const getUserByAccount = async ({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }): Promise<AdapterUser | null> => {
      const dbUser = await db
        .selectFrom("users as u")
        .innerJoin("accounts as a", "u.username", "a.userId")
        .selectAll()
        .where("a.provider", "=", provider)
        .where("a.providerAccountId", "=", providerAccountId)
        .executeTakeFirst();
      if (!dbUser) {
        return null;
      }
      if (!dbUser.primary_email && !dbUser.secondary_email) {
        return null;
      }
      return {
        ...dbUser,
        id: dbUser.username,
        emailVerified: dbUser.email_verified,
        email: (dbUser.primary_email || dbUser.secondary_email)!,
      };
    };

    const updateUser = async (
      user: Partial<AdapterUser> & Pick<AdapterUser, "id">,
    ): Promise<AdapterUser> => {
      const dbUser = await db
        .updateTable("users")
        .where("username", "=", user.id)
        .set({
          email_verified: user.emailVerified,
        })
        .returningAll()
        .executeTakeFirst();
      if (!dbUser) {
        throw new Error("Cannot update user");
      }

      return {
        uuid: dbUser.uuid,
        name: dbUser?.fullname,
        email: (dbUser.primary_email || dbUser.secondary_email)!,
        emailVerified: dbUser.email_verified,
        id: dbUser.username,
      };
    };

    const deleteUser = async (userId: string) => {
      console.log(
        "Unimplemented function! deleteUser in BetagouvAdapter. Session:",
        JSON.stringify(userId),
      );
      return;
    };

    const createSession = async ({
      sessionToken,
      userId,
      expires,
    }: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }): Promise<AdapterSession> => {
      const expiresString = expires.toDateString();
      await db
        .insertInto("sessions")
        .values({
          userId: userId,
          expires: expiresString,
          sessionToken: sessionToken,
        })
        .execute();
      const createdSession: AdapterSession = {
        sessionToken,
        userId,
        expires,
      };
      return createdSession;
    };

    const getSessionAndUser = async (
      sessionToken: string,
    ): Promise<{ session: AdapterSession; user: AdapterUser } | null> => {
      const session = await db
        .selectFrom("sessions")
        .selectAll()
        .where("sessionToken", "=", sessionToken)
        .executeTakeFirst();
      if (!session) {
        throw new Error("Cannot retrieve session");
      }
      const user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", session.userId)
        .executeTakeFirst();
      if (!user) {
        throw new Error("Cannot retrieve user");
      }
      const expiresDate = new Date(session.expires);
      const sessionAndUser: {
        session: AdapterSession;
        user: AdapterUser;
      } = {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: expiresDate,
        },
        user: {
          id: user.username,
          emailVerified: new Date(),
          email: user?.primary_email!,
          name: user.fullname,
          image: null,
          uuid: user.uuid,
        },
      };

      return sessionAndUser;
    };

    const updateSession = async (
      session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">,
    ): Promise<AdapterSession | null | undefined> => {
      console.log(
        "Unimplemented function! updateSession in vercelPostgresAdapter. Session:",
        JSON.stringify(session),
      );
      return;
    };

    const deleteSession = async (sessionToken: string) => {
      await db
        .deleteFrom("sessions")
        .where("sessionToken", "=", sessionToken)
        .execute();
      return;
    };

    const linkAccount = async (
      account: AdapterAccount,
    ): Promise<AdapterAccount | null | undefined> => {
      await db
        .insertInto("accounts")
        .values({
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: sql`${account.expires_at}`,
          id_token: account.id_token,
          scope: account.scope,
          session_state: account.session_state,
          token_type: account.token_type,
        })
        .execute();
      return account;
    };

    const unlinkAccount = async ({
      providerAccountId,
      provider,
    }: {
      providerAccountId: Account["providerAccountId"];
      provider: Account["provider"];
    }) => {
      await db
        .deleteFrom("accounts")
        .where("providerAccountId", "=", providerAccountId)
        .where("provider", "=", provider)
        .execute();
      return;
    };

    return {
      createUser,
      getUser,
      updateUser,
      getUserByEmail,
      getUserByAccount,
      deleteUser,
      getSessionAndUser,
      createSession,
      updateSession,
      deleteSession,
      linkAccount,
      unlinkAccount,
    };
  } catch (error) {
    throw error;
  }
}
