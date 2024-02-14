import session from "express-session";
import makeSessionStore from "@infra/sessionStore/sessionStore";
import config from "@/server/config";
import { getToken } from "../helpers/session";
import jwt from "jsonwebtoken";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const sessionStore =
    process.env.NODE_ENV !== "test" ? makeSessionStore() : null;
export const sessionOptions = {
    store: sessionStore,
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

const getSessionFromStore = async (sid: RequestCookie | undefined) => {
    if (!sid) {
        return null;
    }
    const id = (sid.value as string).split(":")[1].split(".")[0];
    return new Promise((resolve, reject) => {
        sessionStore.client.get(`cookiestore:${id}`, (error, result) => {
            if (error) {
                reject(error); // If there's an error, reject the promise
            } else {
                const token = JSON.parse(result).token;
                jwt.verify(token, config.secret, (err, user) => {
                    if (!err) {
                        resolve(user); // Otherwise, resolve with the result
                    } else {
                        reject(err);
                    }
                });
            }
        });
    });
};

export { setupSessionMiddleware, getSessionFromStore };
