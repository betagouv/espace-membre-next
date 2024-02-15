import bodyParser from "body-parser";
import compression from "compression";
import flash from "connect-flash";
import express from "express";
import next from "next";

import { expressjwt, Request } from "express-jwt";

import expressSanitizer from "express-sanitizer";
import config from "@/server/config";
import * as githubNotificationController from "@controllers/githubNotificationController";
import * as indexController from "@controllers/indexController";
import * as resourceController from "@controllers/resourceController";
import * as hookController from "@controllers/hookController";
import * as pullRequestsController from "@controllers/pullRequestsController";
import routes from "@/routes/routes";
import { rateLimiter } from "./middlewares/rateLimiter";
import { getJwtTokenForUser, getToken } from "@/server/helpers/session";
import getAllIncubators from "./controllers/incubatorController/api/getAllIncubators";
import getAllSponsors from "./controllers/sponsorController/api/getAllSponsors";
import {
    accountRouter,
    adminRouter,
    authRouter,
    badgeRouter,
    communityRouter,
    diagnosticRouter,
    userRouter,
    userApiRouter,
    userPublicApiRouter,
    mapRouter,
    newsletterRouter,
    onboardingRouter,
    setupStaticFiles,
    startupRouter,
} from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { setupSessionMiddleware } from "./middlewares/sessionMiddleware";
import { PUBLIC_ROUTES } from "./config/jwt.config";
import { initializeSentry, sentryErrorHandler } from "@lib/sentry";

const port = parseInt(process.env.PORT || "8100", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
let server = express();

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
        server.use("/api", compression());
        setupStaticFiles(server);
        setupSessionMiddleware(server);
        server.use("/api", flash());
        server.use("/api", expressSanitizer());
        server.use("/api", bodyParser.urlencoded({ extended: false }));
        server.use("/api", rateLimiter);
        server.use(
            "/api",
            expressjwt({
                secret: config.secret,
                algorithms: ["HS256"],
                getToken: (req) => {
                    return getToken(req);
                },
            }).unless({
                path: [...PUBLIC_ROUTES],
            })
        );
        // Save a token in cookie that expire after 7 days if user is logged
        server.use("/api", (req: Request, res, nextCall) => {
            if (req.auth && req.auth.id) {
                // @ts-expect-error
                (req.session.token = getJwtTokenForUser(req.auth.id)),
                    { sameSite: "lax" };
            }
            nextCall();
        });
        server.use("/api", errorHandler);

        //ROUTES
        server.get("/", indexController.getIndex);
        server.use(userRouter);
        server.use(userApiRouter);
        server.use(userPublicApiRouter);
        server.use(accountRouter);
        server.use(startupRouter);
        server.use(communityRouter);
        server.use(adminRouter);
        server.use(authRouter);
        server.use(diagnosticRouter);
        server.use(badgeRouter);
        server.use(newsletterRouter);
        server.use(onboardingRouter);
        server.use(mapRouter);

        server.get(
            routes.PULL_REQUEST_GET_PRS,
            pullRequestsController.getAllPullRequests
        );
        // INCUBATORS
        server.get(routes.API_PUBLIC_INCUBATORS_GET_ALL, getAllIncubators);

        //sponsors
        server.get(routes.API_PUBLIC_SPONSORS_GET_ALL, getAllSponsors);

        server.get("/resources", resourceController.getResources);
        server.post(
            "/hook/:hookId",
            express.json({ type: "*/*" }),
            hookController.postToHook
        );
        // Default catch-all handler to allow Next.js to handle all other routes
        server.all("*", (req, res) => {
            return handle(req, res);
        });
        server.use(sentryErrorHandler);

        return server.listen(port, () =>
            console.log(
                `Running on: ${config.protocol}://${config.host}:${port}`
            )
        );
    });
};
export { startServer };
export default server;
