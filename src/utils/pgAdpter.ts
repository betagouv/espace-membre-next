import { Account, Awaitable } from "next-auth";
import {
    Adapter,
    AdapterAccount,
    AdapterSession,
    AdapterUser,
    VerificationToken,
} from "next-auth/adapters";

import { DBUser, EmailStatusCode } from "@/models/dbUser";
import betagouv from "@/server/betagouv";
import db from "@/server/db";

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
            const user: DBUser = await db("users")
                .where({
                    username: id,
                })
                .first();
            if (!user.primary_email && !user.secondary_email) {
                throw new Error(`User ${user.username} has no em`);
            }
            return {
                id: user.username,
                emailVerified: user.email_verified,
                email: user.primary_email || user.secondary_email,
            };
        };

        const getUserByEmail = async (
            email: string
        ): Promise<AdapterUser | null> => {
            const dbUser: DBUser = await db("users")
                .whereRaw(`LOWER(secondary_email) = ?`, email)
                .orWhereRaw(`LOWER(primary_email) = ?`, email)
                .first();
            if (!dbUser.primary_email && !dbUser.secondary_email) {
                return null;
            }
            return dbUser
                ? {
                      ...dbUser,
                      id: dbUser.username,
                      emailVerified: dbUser.email_verified,
                      email: dbUser.primary_email || dbUser.secondary_email,
                  }
                : null;
        };

        const getUserByAccount = async ({
            provider,
            providerAccountId,
        }: {
            provider: string;
            providerAccountId: string;
        }): Promise<AdapterUser | null> => {
            const dbUser: DBUser = await db("users as u")
                .join("accounts as a", "u.username", "=", "a.userId")
                .select("u.*")
                .where({
                    "a.providerId": provider,
                    "a.providerAccountId": providerAccountId,
                })
                .first();
            if (!dbUser.primary_email && !dbUser.secondary_email) {
                return null;
            }
            return dbUser
                ? {
                      ...dbUser,
                      id: dbUser.username,
                      emailVerified: dbUser.email_verified,
                      email: dbUser.primary_email || dbUser.secondary_email,
                  }
                : null;
        };

        const updateUser = async (
            user: Partial<AdapterUser> & Pick<AdapterUser, "id">
        ): Promise<AdapterUser> => {
            const [dbUser]: DBUser[] = await db("users")
                .where({
                    username: user.id,
                })
                .update({
                    email_verified: user.emailVerified,
                })
                .returning("*");

            const member = await betagouv.userInfosById(user.id);
            return {
                name: member?.fullname,
                email: dbUser.primary_email || dbUser.secondary_email,
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
            await db("sessions").insert({
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
            const session = await db("sessions")
                .where({
                    sessionToken,
                })
                .first();
            const user: DBUser = await db("users")
                .where({
                    username: session.userId,
                })
                .first();
            const member = await betagouv.userInfosById(user.username);
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
                    email: user.primary_email!,
                    name: member?.fullname,
                    image: null,
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
            await db("sessions").where({ sessionToken }).delete();
            return;
        };

        const linkAccount = async (
            account: AdapterAccount
        ): Promise<AdapterAccount | null | undefined> => {
            await db("accounts").insert({
                userId: account.userId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: db.raw("to_timestamp(?)", [account.expires_at]),
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
            await db("account")
                .where({
                    providerAccountId,
                    provider,
                })
                .delete();
            return;
        };

        const createVerificationToken = async ({
            identifier,
            expires,
            token,
        }: VerificationToken): Promise<
            VerificationToken | null | undefined
        > => {
            const [insertedRow] = await db("verification_tokens")
                .insert({
                    identifier: identifier,
                    token: token,
                    expires: expires,
                })
                .returning("*"); // This will return all columns of the inserted row

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
            const rows = await db("verification_tokens")
                .select("*")
                .where({
                    identifier: identifier,
                    token: token,
                })
                .andWhere("expires", ">", db.fn.now())
                .then((rows) => rows)
                .catch((err) => {
                    console.error(err);
                    throw new Error("Error fetching verification token");
                });

            // If a token is found, delete it
            if (rows.length > 0) {
                await db("verification_tokens")
                    .where({
                        identifier: identifier,
                        token: token,
                    })
                    .del()
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
