// import { getBadgePageApi } from "@controllers/accountController/getBadgePage";
import express from "express";

import { publicPostRouteRateLimiter } from "../middlewares/rateLimiter";
import { validate } from "../middlewares/zodValidator";
import { memberSchema } from "@/models/member";
import routes from "@/routes/routes";
import * as accountController from "@controllers/accountController";
// import { getBadgeRenewalPage } from "@controllers/accountController/getBadgeRenewalPage";
import * as usersController from "@controllers/usersController";

const router = express.Router();

// router.get(routes.ACCOUNT_GET_API, accountController.getCurrentAccountApi);
// router.get(
//     routes.ACCOUNT_GET_DETAIL_INFO_FORM_API,
//     accountController.getDetailInfoUpdateApi
// );
// router.post(
//   routes.ACCOUNT_POST_DETAIL_INFO_FORM,
//   accountController.postCurrentInfo
// );
router.post(
    routes.ACCOUNT_POST_DETAIL_INFO_FORM_API,
    express.json({ type: "*/*" }),
    accountController.postCurrentInfoApi
);

// router.post(
//     routes.ACCOUNT_POST_BASE_INFO_FORM,
//     express.json({ type: "*/*" }),
//     validate(memberSchema, "body"),
//     usersController.postBaseInfoUpdate
// );
// router.post(
//     routes.API_PUBLIC_POST_BASE_INFO_FORM,
//     publicPostRouteRateLimiter,
//     express.json({ type: "*/*" }),
//     usersController.publicPostBaseInfoUpdate
// );
// router.get(
//     routes.ACCOUNT_GET_BADGE_RENEWAL_REQUEST_PAGE_API,
//     getBadgeRenewalPage
// );
// router.get(routes.ACCOUNT_GET_BADGE_REQUEST_PAGE_API, getBadgePageApi);

// router.post(
//     "/account/delete_email_responder",
//     accountController.deleteEmailResponder
// );
// router.post(
//     "/api/account/delete_email_responder",
//     express.json({ type: "*/*" }),
//     accountController.deleteEmailResponderApi
// );
// router.post(
//     "/account/set_email_responder",
//     accountController.setEmailResponder
// );
// router.post(
//     routes.USER_SET_EMAIL_RESPONDER_API,
//     express.json({ type: "*/*" }),
//     accountController.setEmailResponderApi
// );

// router.post(
//     routes.USER_UPDATE_COMMUNICATION_EMAIL,
//     accountController.updateCommunicationEmail
// );
// router.put(
//     routes.USER_UPDATE_COMMUNICATION_EMAIL_API,
//     express.json({ type: "*/*" }),
//     accountController.updateCommunicationEmailApi
// );

router.get(
    routes.ME,
    express.json({ type: "*/*" }),
    accountController.getCurrentUser
);

export { router as accountRouter };
