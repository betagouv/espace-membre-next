import express from "express";
import * as adminController from "@controllers/adminController";
import permit, { MemberRole } from "../middlewares/authorization";
import routes from "@/routes/routes";

const router = express.Router();

// ONLY FOR ADMIN
router.get(
    routes.ADMIN_MATTERMOST_API,
    permit(MemberRole.MEMBER_ROLE_ADMIN),
    adminController.getMattermostAdminApi
);
router.get(
    routes.ADMIN_MATTERMOST_MESSAGE_API,
    permit(MemberRole.MEMBER_ROLE_ADMIN),
    express.json({ type: "*/*" }),
    adminController.getMattermostUsersInfo
);
router.post(
    routes.ADMIN_MATTERMOST_SEND_MESSAGE,
    permit(MemberRole.MEMBER_ROLE_ADMIN),
    express.json({ type: "*/*" }),
    adminController.sendMessageToUsersOnChat
);
router.get(
    routes.ADMIN_SENDINBLUE,
    permit(MemberRole.MEMBER_ROLE_ADMIN),
    express.json({ type: "*/*" }),
    adminController.getSendinblueInfo
);

router.get("/api/get-users", adminController.getUsers);

export { router as adminRouter };
