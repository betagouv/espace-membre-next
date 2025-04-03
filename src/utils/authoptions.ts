import jwt, { JwtPayload, VerifyOptions } from "jsonwebtoken";
import { NextAuthOptions, User } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { v4 as uuidv4 } from "uuid";
import customPostgresAdapter from "./pgAdpter";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import config from "@/server/config";
import { getAdmin } from "@/server/config/admin.config";
import { sendEmail } from "@/server/config/email.config";
import { checkUserIsExpired } from "@/server/controllers/utils";
import { getJwtTokenForUser } from "@/server/helpers/session";
import { EMAIL_TYPES } from "@/server/modules/email";
import { db } from "@/lib/kysely";

async function sendVerificationRequest(params) {
    const { identifier, url } = params;
    const urlObj = new URL(url);
    await sendEmail({
        type: EMAIL_TYPES.EMAIL_LOGIN,
        variables: {
            loginUrlWithToken: `${process.env.NEXTAUTH_URL}/signin${urlObj.search}`,
            fullname: "", // @todo add fullname
        },
        toEmail: [identifier],
    });
}
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

type UserWithInfo = User & {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    poste: string;
};

export const authOptions: NextAuthOptions = {
    adapter: customPostgresAdapter(),
    debug: process.env.NODE_ENV !== "production",
    providers: [
        EmailProvider({
            sendVerificationRequest,
            maxAge: 3600,
        }),
        {
            id: "proconnect",
            name: "Pro Connect",
            type: "oauth",
            version: "2.0",
            idToken: false, // todo: should use builtin function instead of token below
            options: {
                clientId: process.env.PRO_CONNECT_ID || "",
                clientSecret: process.env.PRO_CONNECT_SECRET || "",
            },
            // requestTokenUrl: process.env.PRO_CONNECT_BASE_URL + "/api/v2/token",

            wellKnown:
                process.env.PRO_CONNECT_BASE_URL +
                "/api/v2/.well-known/openid-configuration",
            allowDangerousEmailAccountLinking: true, // cause errors
            checks: ["nonce", "state"],
            authorization: {
                params: {
                    scope: "openid uid given_name usual_name email", // "openid uid given_name usual_name email siret",
                    acr_values: "eidas1",
                    redirect_uri: process.env.NEXTAUTH_URL + "/oauth2/callback", // for PC callbacks
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
            token: {
                //special id token for some reason
                request: async (context) => {
                    const body = {
                        grant_type: "authorization_code",
                        client_id: process.env.PRO_CONNECT_ID || "",
                        client_secret: process.env.PRO_CONNECT_SECRET || "",
                        redirect_uri:
                            process.env.NEXTAUTH_URL + "/oauth2/callback",
                        //+"/api/auth/callback/proconnect",
                        code: context.params.code || "undefined",
                    };
                    const data = new URLSearchParams(body).toString();
                    const tokenResponse = await fetch(
                        process.env.PRO_CONNECT_BASE_URL + "/api/v2/token",
                        {
                            method: "POST",
                            headers: {
                                "content-type":
                                    "application/x-www-form-urlencoded",
                            },
                            body: data,
                        }
                    ).then((r) => r.json());
                    return { tokens: tokenResponse };
                },
            },

            // special JARM JWT for ProConnect user info
            userinfo: {
                request: async ({ tokens }) => {
                    const userInfoRequest = await fetch(
                        process.env.PRO_CONNECT_BASE_URL + "/api/v2/userinfo",
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${tokens.access_token}`,
                            },
                        }
                    ).then((r) => r.text());
                    // User info returns a JWT token instead of a JSON object, we decode it
                    return jwt.decode(userInfoRequest) as ProConnectProfile;
                },
            },

            profile: async (profile) => {
                // use profile from local DB
                const dbUser = await db
                    .selectFrom("users")
                    .select(["username", "primary_email", "uuid", "fullname"])
                    .where(({ eb }) =>
                        eb.or([
                            eb("primary_email", "=", profile.email),
                            eb("secondary_email", "=", profile.email),
                        ])
                    )
                    .executeTakeFirstOrThrow();

                return {
                    id: dbUser.username,
                    uuid: dbUser.uuid,
                    name: dbUser.fullname,
                    email: dbUser.primary_email,
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
        error: "/auth/error", // Error code passed in query string as ?error=
        verifyRequest: "/auth/verify-request", // (used for check email message)
        // newUser: "/auth/new-user", // New users will be directed here on first sign in (leave the property out if not of interest)
    },
    jwt: {
        async encode({ secret, token }) {
            //console.log("encode", token);
            return getJwtTokenForUser(token);
        },
        async decode({ secret, token }) {
            // console.log("decode", token);
            if (token) {
                try {
                    const decoded = jwt.verify(token, config.secret, {
                        algorithm: "HS512",
                    } as VerifyOptions);
                    if (!decoded["uuid"]) {
                        // in case it was an old session without uuid
                        return null;
                    }
                    return decoded as JwtPayload;
                } catch (error) {
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
            console.log("signIn", user);
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
                return true; // if the email exists in the User collection, continue process
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
                        uuid: token.uuid,
                        isAdmin: getAdmin().includes(token.sub || ""),
                    },
                };
            }
            return sessionWithId || session;
        },
        async jwt({ token, user, account, profile, isNewUser, session }) {
            //console.log("jwt", token, user, account, session);
            if (account) {
                token.id = user?.id;
                token.uuid = user?.uuid;
                token.provider = account.provider;
                token.name = user?.name;
            }
            return token;
        },
    },
};
