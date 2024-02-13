import session from "express-session";
import makeSessionStore from "@infra/sessionStore/sessionStore";
import config from "@/server/config";
import { getToken } from "../helpers/session";
import { cookies } from "next/headers";

const jwt = require("jsonwebtoken");

export const sessionStore =
    process.env.NODE_ENV !== "test" ? makeSessionStore() : null;
export const sessionOptions = {
    store: sessionStore,
    secret: config.secret,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    unset: "destroy",
    proxy: true, // Required for Heroku & Digital Ocean (regarding X-Forwarded-For)
    name: "espaceMembreCookieName",
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

export const getSessionFromStore = async () => {
    const cookieStore = cookies();
    const sid = cookieStore.get("espaceMembreCookieName");
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

function getAuthTokenIfExist(req, res, next) {
    // Essayer de récupérer le token du header 'Authorization'
    const authHeader = getToken(req);
    if (authHeader) {
        const token = authHeader; // Bearer TOKEN_HERE

        jwt.verify(token, config.secret, (err, user) => {
            if (!err) {
                req.user = user; // Attacher l'utilisateur à l'objet de la requête
            }
            next(); // Passe au prochain middleware / route
        });
    } else {
        next(); // Pas de token, continuer sans erreur
    }
}

export { setupSessionMiddleware, getAuthTokenIfExist };
