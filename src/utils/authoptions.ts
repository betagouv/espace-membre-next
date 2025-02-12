import jwt, { JwtPayload, VerifyOptions } from "jsonwebtoken";
import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";

import customPostgresAdapter from "./pgAdpter";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import config from "@/server/config";
import { getAdmin } from "@/server/config/admin.config";
import { sendEmail } from "@/server/config/email.config";
import { checkUserIsExpired } from "@/server/controllers/utils";
import { getJwtTokenForUser } from "@/server/helpers/session";
import { EMAIL_TYPES } from "@/server/modules/email";

async function sendVerificationRequest(params) {
    const { identifier, url } = params;
    const urlObj = new URL(url);
    await sendEmail({
        type: EMAIL_TYPES.LOGIN_EMAIL,
        variables: {
            loginUrlWithToken: `${process.env.NEXTAUTH_URL}/signin${urlObj.search}`,
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
                    const decoded = jwt.verify(token, config.secret, {
                        algorithm: "HS512", // Assurez-vous que l'algorithme correspond à celui utilisé pour signer le token
                    } as VerifyOptions);
                    if (!decoded["uuid"]) {
                        // in case it was an old session without uuid
                        return null;
                    }
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
        async signIn({ user }) {
            if (user.id) {
                // todo : this can be done in the call where user is fetch from db
                const dbUser = await getUserInfos({
                    username: user.id,
                    options: {
                        withDetails: true,
                    },
                });
                if (!dbUser) {
                    throw new Error(
                        `Il n'y a pas de fiche dans l'espace-membre pour cet email. Un membre de la communauté peut en créer une.`
                    );
                }
                if (checkUserIsExpired(memberBaseInfoToModel(dbUser), 5)) {
                    throw new Error(
                        `Membre ${dbUser.fullname} a une date de fin expirée ou pas de mission définie.`
                    );
                }
                return true; //if the email exists in the User collection, email them a magic login link
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
                        id: token.sub,
                        uuid: token.uuid,
                        isAdmin: getAdmin().includes(token.sub || ""),
                    },
                };
            }
            return sessionWithId || session;
        },
        async jwt({ token, user, account, profile, isNewUser }) {
            if (account) {
                token.id = user?.id;
                token.uuid = user?.uuid;
            }
            return token;
        },
        // async redirect({ url, baseUrl }) {
        //     // Allows relative callback URLs
        //     if (url.startsWith("/")) {
        //         console.log(`${baseUrl}${url}`);
        //         return `${baseUrl}${url}`;
        //     }
        //     // Allows callback URLs on the same origin
        //     else if (new URL(url).origin === baseUrl) return url;
        //     return baseUrl;
        // },
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
