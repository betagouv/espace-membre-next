import express from "express";

import * as mapController from "@controllers/mapController";

const router = express.Router();

router.get("/api/get-users-location", mapController.getUsersLocation);

export { router as mapRouter };
