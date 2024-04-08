import jwt, { JwtPayload } from "jsonwebtoken";
import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";

import customPostgresAdapter from "./pgAdpter";
import config from "@/server/config";
import { getAdmin } from "@/server/config/admin.config";
import { sendEmail } from "@/server/config/email.config";
import db from "@/server/db";
import { getJwtTokenForUser } from "@/server/helpers/session";
import { EMAIL_TYPES } from "@/server/modules/email";

async function sendVerificationRequest(params) {
    const { identifier, url, provider, theme } = params;
    await sendEmail({
        type: EMAIL_TYPES.LOGIN_EMAIL,
        variables: {
            loginUrlWithToken: url,
        },
        toEmail: [identifier],
    });
}

export const authOptions: NextAuthOptions = {
    adapter: customPostgresAdapter(),
    debug: true,
    providers: [
        EmailProvider({
            sendVerificationRequest,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    secret: config.secret,
    pages: {
        signIn: "/login",
        signOut: "/auth/signout",
        error: "/auth/error", // Error code passed in query string as ?error=
        verifyRequest: "/auth/verify-request", // (used for check email message)
        // newUser: "/auth/new-user", // New users will be directed here on first sign in (leave the property out if not of interest)
    },
    jwt: {
        async encode({ secret, token }) {
            return getJwtTokenForUser(token);
        },
        async decode({ secret, token }) {
            if (token) {
                try {
                    const decoded = await jwt.verify(token, config.secret, {
                        algorithms: ["HS512"], // Assurez-vous que l'algorithme correspond à celui utilisé pour signer le token
                    });
                    return decoded as JwtPayload; // Assurez-vous que cette conversion est sûre.
                } catch (error) {
                    // Gérer l'erreur, par exemple en retournant `null` ou en relançant l'erreur.
                    console.error(
                        "Erreur lors de la décodification du token:",
                        error
                    );
                    return null;
                }
            }
            return null;
        },
    },
    callbacks: {
        async signIn({ user, account, email }) {
            const userExists = await db("users").where({
                primary_email: user.email, //the user object has an email property, which contains the email the user entered.
            });
            if (userExists) {
                return true; //if the email exists in the User collection, email them a magic login link
            } else {
                return "/register";
            }
        },
        async session({ session, token }) {
            let sessionWithId;
            if (session && session.user) {
                sessionWithId = {
                    ...session,
                    user: {
                        ...session.user,
                        id: token.sub,
                        isAdmin: getAdmin().includes(token.sub || ""),
                    },
                };
            }
            return sessionWithId || session;
        },
        async jwt({ token, user, account, profile, isNewUser }) {
            if (account) {
                token.id = user?.id;
            }
            return token;
        },
    },
    // CredentialsProvider({
    //     name: "Credentials",
    //     credentials: {
    //         email: { label: "Username", type: "text" },
    //         password: { label: "Password", type: "password" },
    //     },
    //     authorize(credentials: any, req) {
    //         // database operations
    //         return {
    //             id: "1",
    //             Email: credentials.email,
    //         };
    //     },
    // }),
};
