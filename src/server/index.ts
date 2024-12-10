import * as Sentry from "@sentry/node";
import bodyParser from "body-parser";
import compression from "compression";
import flash from "connect-flash";
import cookieParser from "cookie-parser";
import express from "express";
import { expressjwt, Request } from "express-jwt";
import expressSanitizer from "express-sanitizer";
import next from "next";

import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "./config/jwt.config";
//import getAllIncubators from "./controllers/incubatorController/api/getAllIncubators";
//import getAllSponsors from "./controllers/sponsorController/api/getAllSponsors";
import { errorHandler } from "./middlewares/errorHandler";
import { rateLimiter } from "./middlewares/rateLimiter";
import { setupSessionMiddleware } from "./middlewares/sessionMiddleware";
import {
    adminRouter,
    badgeRouter,
    userRouter,
    userApiRouter,
    setupStaticFiles,
} from "./routes";
//import routes from "@/routes/routes";
import config from "@/server/config";
import { getToken } from "@/server/helpers/session";
import * as indexController from "@controllers/indexController";
//import * as pullRequestsController from "@controllers/pullRequestsController";
import * as resourceController from "@controllers/resourceController";
import { initializeSentry } from "@lib/sentry";

const port = parseInt(process.env.PORT || "8100", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
let server = express();

function excludeApiAuthMiddleware(middleware) {
    return function (req, res, next) {
        // Check if the request starts with /api/auth
        if (req.path.startsWith("/auth/")) {
            return next(); // Skip the middleware if the path starts with /api/auth
        } else {
        }
        return middleware(req, res, next); // Apply the middleware otherwise
    };
}

const startServer = () => {
    return app.prepare().then(() => {
        // Define custom routes here, e.g., server.get('/my-route', (req, res) => { ... });

        server.set("trust proxy", 1);

        // server.use(cors(corsOptions));
        // server.options("*", cors(corsOptions));

        // server.set("view engine", "ejs");
        // server.set("views", path.join(__dirname, "./views/templates")); // the code is running in directory "dist".

        // MIDDLEWARES
        initializeSentry(server);
        setupStaticFiles(server);
        setupSessionMiddleware(server);
        server.use("/api", excludeApiAuthMiddleware(compression()));
        server.use("/api", excludeApiAuthMiddleware(flash()));
        server.use("/api", excludeApiAuthMiddleware(expressSanitizer()));
        server.use("/api", excludeApiAuthMiddleware(cookieParser()));
        server.use(
            "/api",
            excludeApiAuthMiddleware(bodyParser.urlencoded({ extended: false }))
        );
        server.use("/api", excludeApiAuthMiddleware(rateLimiter));
        server.use(
            "/api",
            excludeApiAuthMiddleware(
                expressjwt({
                    secret: config.secret,
                    algorithms: ["HS512"],
                    getToken: (req) => {
                        // in test stub does not work if we asign getToken directly
                        const token = getToken(req);
                        return token;
                    },
                }).unless({
                    path: [...PUBLIC_ROUTES, ...PROTECTED_ROUTES],
                })
            )
        );
        server.use("/api", errorHandler);

        //ROUTES
        server.get("/", indexController.getIndex);
        server.use(userRouter);
        server.use(userApiRouter);
        server.use(adminRouter);
        // server.use(authRouter);
        server.use(badgeRouter);

        server.get("/resources", resourceController.getResources);

        // Default catch-all handler to allow Next.js to handle all other routes
        server.all("*", (req, res) => {
            return handle(req, res);
        });

        Sentry.setupExpressErrorHandler(server);

        return server.listen(port, () =>
            console.log(
                `Running on: ${config.protocol}://${config.host}:${port}`
            )
        );
    });
};
export { startServer };
export default server;
