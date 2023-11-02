import { NextAuthOptions } from "next-auth";
import config from "@/config";

// Adapter : The Credentials provider can only be used if JSON Web Tokens are enabled for sessions. Users authenticated with the Credentials provider are not persisted in the database.
export const authOptions: NextAuthOptions = {
    //adapter: PostgresAdapter(pool),
    secret: config.secret,
    cookies: {
        sessionToken: {
            name: "espaceMembreCookieName2",
            options: {},
        },
    },
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
        // CredentialsProvider({
        //     name: "Credentials",
        //     credentials: {
        //         // email: { label: "Email", type: "text" },
        //         token: { label: "token", type: "password" },
        //     },
        //     async authorize(credentials: any, req) {
        //         // database operations
        //         try {
        //             return {
        //                 user: {},
        //             };
        //             // const user = await postSignIn(
        //             //     {
        //             //         body: {
        //             //             token: credentials.token,
        //             //         },
        //             //     },
        //             //     Response
        //             // );
        //             // return {
        //             //     ...user,
        //             // };
        //         } catch (e) {
        //             console.error(e);
        //             return null;
        //         }
        //     },
        // }),
    ],
};
