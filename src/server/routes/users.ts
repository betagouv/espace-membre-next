import express from "express";
import * as usersController from "../controllers/usersController";
import routes from "@/routes/routes";
import { publicGetRouteRateLimiter } from "@/server/middlewares/rateLimiter";

const router = express.Router();
const apiRouter = express.Router();
const publicApiRouter = express.Router();

// users
// router.post(routes.USER_CREATE_EMAIL, usersController.createEmailForUser);

apiRouter.post(
    routes.USER_DELETE_EMAIL_API,
    express.json({ type: "*/*" }),
    usersController.deleteEmailForUserApi
);
apiRouter.put(
    routes.USER_UPDATE_PRIMARY_EMAIL_API,
    express.json({ type: "*/*" }),
    usersController.managePrimaryEmailForUserApi
);
apiRouter.post(
    routes.USER_UPDATE_SECONDARY_EMAIL_API,
    express.json({ type: "*/*" }),
    usersController.manageSecondaryEmailForUserApi
);
apiRouter.post(
    routes.USER_UPDATE_PASSWORD_API,
    express.json({ type: "*/*" }),
    usersController.updatePasswordForUserApi
);
apiRouter.delete(
    routes.USER_DELETE_REDIRECTION_API,
    express.json({ type: "*/*" }),
    usersController.deleteRedirectionForUserApi
);
apiRouter.post(
    routes.USER_CREATE_REDIRECTION_API,
    express.json({ type: "*/*" }),
    usersController.createRedirectionForUserApi
);
apiRouter.post(
    routes.USER_UPGRADE_EMAIL_API,
    express.json({ type: "*/*" }),
    usersController.upgradeEmailForUserApi
);
apiRouter.post(
    routes.USER_CREATE_EMAIL_API,
    express.json({ type: "*/*" }),
    usersController.createEmailApi
);

publicApiRouter.get(
    routes.API_GET_PUBLIC_USER_INFO,
    publicGetRouteRateLimiter,
    usersController.getUserInfo
);

export {
    router as userRouter,
    apiRouter as userApiRouter,
    publicApiRouter as userPublicApiRouter,
};
