import express from "express";

import routes from "@/routes/routes";
// import * as communityController from "@controllers/communityController";

const router = express.Router();

//router.get(routes.GET_COMMUNITY_API, communityController.getCommunityApi);
// router.get(routes.GET_USER_API, communityController.getUserApi);

export { router as communityRouter };
