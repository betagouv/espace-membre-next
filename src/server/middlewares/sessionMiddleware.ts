import session from "express-session";
import makeSessionStore from "@infra/sessionStore/sessionStore";
import config from "@/server/config";
import { getToken } from "../helpers/session";
const jwt = require("jsonwebtoken");

const setupSessionMiddleware = (app) => {
    app.use(
        session({
            store: process.env.NODE_ENV !== "test" ? makeSessionStore() : null,
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
        })
    ); // Only used for Flash not safe for others purposes
};

function getAuthTokenIfExist(req, res, next) {
    // Essayer de récupérer le token du header 'Authorization'
    const authHeader = getToken(req);
    if (authHeader) {
        const token = authHeader; // Bearer TOKEN_HERE

        jwt.verify(token, config.secret, (err, user) => {
            console.log(user);
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
