import express from "express";

import routes from "@/routes/routes";
import * as newsletterController from "@controllers/newsletterController";

const router = express.Router();

router.get(routes.NEWSLETTERS_API, newsletterController.getNewsletterApi);

router.get("/validateNewsletter", newsletterController.validateNewsletter);
router.get("/cancelNewsletter", newsletterController.cancelNewsletter);

export { router as newsletterRouter };
