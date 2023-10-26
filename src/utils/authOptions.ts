import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
import { postSignIn } from "@/controllers/loginController/postSignIn";

// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     max: 20,
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 2000,
// });

// Adapter : The Credentials provider can only be used if JSON Web Tokens are enabled for sessions. Users authenticated with the Credentials provider are not persisted in the database.
export const authOptions: NextAuthOptions = {
    //adapter: PostgresAdapter(pool),
    providers: [
        // EmailProvider({
        //     server: {
        //         host: process.env.EMAIL_SERVER_HOST,
        //         port: process.env.EMAIL_SERVER_PORT,
        //         auth: {
        //             user: process.env.EMAIL_SERVER_USER,
        //             pass: process.env.EMAIL_SERVER_PASSWORD,
        //         },
        //     },
        //     from: process.env.EMAIL_FROM,
        // }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                // email: { label: "Email", type: "text" },
                token: { label: "token", type: "password" },
            },
            async authorize(credentials: any, req) {
                // database operations
                try {
                    const user = await postSignIn(
                        {
                            body: {
                                token: credentials.token,
                            },
                        },
                        Response
                    );
                    return {
                        ...user,
                    };
                } catch (e) {
                    console.error(e);
                    return null;
                }
            },
        }),
    ],
};
