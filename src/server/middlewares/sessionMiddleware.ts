import session from "express-session";
import jwt from "jsonwebtoken";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

import { getToken } from "../helpers/session";
import config from "@/server/config";
import makeSessionStore from "@infra/sessionStore/sessionStore";

export const sessionStore =
    process.env.NODE_ENV !== "test" ? makeSessionStore() : null;
export const sessionOptions = {
    // store: sessionStore,
    secret: config.secret,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    unset: "destroy",
    proxy: true, // Required for Heroku & Digital Ocean (regarding X-Forwarded-For)
    name: config.SESSION_COOKIE_NAME,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: "lax",
    },
};

const setupSessionMiddleware = (app) => {
    app.use(session(sessionOptions)); // Only used for Flash not safe for others purposes
};

export { setupSessionMiddleware };
