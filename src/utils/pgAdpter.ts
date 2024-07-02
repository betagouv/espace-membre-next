import { sql } from "kysely";
import { Account, Awaitable } from "next-auth";
import {
    Adapter,
    AdapterAccount,
    AdapterSession,
    AdapterUser,
    VerificationToken,
} from "next-auth/adapters";

import { db } from "@/lib/kysely";
import betagouv from "@/server/betagouv";

export default function customPostgresAdapter(): Adapter {
    try {
        const createUser = (
            user: Omit<AdapterUser, "id">
        ): Promise<AdapterUser> => {
            console.log(
                "Unimplemented function! createUser in BetagouvAdapter. Session:"
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
            email: string
        ): Promise<AdapterUser | null> => {
            const dbUser = await db
                .selectFrom("users")
                .selectAll()
                .where((eb) =>
                    eb.or([
                        eb(sql`LOWER(users.secondary_email)`, "=", email),
                        eb(sql`LOWER(users.primary_email)`, "=", email),
                    ])
                )
                .executeTakeFirst();
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
            user: Partial<AdapterUser> & Pick<AdapterUser, "id">
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
                JSON.stringify(userId)
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
            await db.insertInto("sessions").values({
                userId: userId,
                expires: expiresString,
                sessionToken: sessionToken,
            });
            const createdSession: AdapterSession = {
                sessionToken,
                userId,
                expires,
            };
            return createdSession;
        };

        const getSessionAndUser = async (
            sessionToken: string
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
            session: Partial<AdapterSession> &
                Pick<AdapterSession, "sessionToken">
        ): Promise<AdapterSession | null | undefined> => {
            console.log(
                "Unimplemented function! updateSession in vercelPostgresAdapter. Session:",
                JSON.stringify(session)
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
            account: AdapterAccount
        ): Promise<AdapterAccount | null | undefined> => {
            await db.insertInto("accounts").values({
                userId: account.userId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: sql`to_timestamp(${account.expires_at})`,
                id_token: account.id_token,
                scope: account.scope,
                session_state: account.session_state,
                token_type: account.token_type,
            });
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

        const createVerificationToken = async ({
            identifier,
            expires,
            token,
        }: VerificationToken): Promise<
            VerificationToken | null | undefined
        > => {
            const insertedRow = await db
                .insertInto("verification_tokens")
                .values({
                    identifier: identifier,
                    token: token,
                    expires: expires,
                })
                .returningAll()
                .executeTakeFirst(); // This will return all columns of the inserted row
            if (!insertedRow) {
                throw new Error("Row not created");
            }
            const createdToken: VerificationToken = {
                identifier: insertedRow.identifier,
                token: insertedRow.token,
                expires: insertedRow.expires,
            };
            return createdToken;
        };

        //Return verification token from the database and delete it so it cannot be used again.
        const useVerificationToken = async ({
            identifier,
            token,
        }: {
            identifier: string;
            token: string;
        }) => {
            const rows = await db
                .selectFrom("verification_tokens")
                .selectAll()
                .where("identifier", "=", identifier)
                .where("token", "=", token)
                .where("expires", ">", new Date())
                .execute()
                .then((rows) => rows)
                .catch((err) => {
                    console.error(err);
                    throw new Error("Error fetching verification token");
                });

            // If a token is found, delete it
            if (rows.length > 0) {
                await db
                    .deleteFrom("verification_tokens")
                    .where("identifier", "=", identifier)
                    .where("token", "=", token)
                    .execute()
                    .catch((err) => {
                        console.error(err);
                        throw new Error("Error deleting verification token");
                    });

                // Return the details of the deleted token
                return {
                    expires: rows[0].expires,
                    identifier: rows[0].identifier,
                    token: rows[0].token,
                };
            } else {
                // Handle the case where no token is found or it's already expired
                throw new Error("No valid token found");
            }
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
            createVerificationToken,
            useVerificationToken,
            linkAccount,
            unlinkAccount,
        };
    } catch (error) {
        throw error;
    }
}
