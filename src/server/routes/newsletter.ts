import express from "express";
import * as newsletterController from "@controllers/newsletterController";
import routes from "@/routes/routes";

const router = express.Router();

router.get(routes.NEWSLETTERS_API, newsletterController.getNewsletterApi);

router.get("/validateNewsletter", newsletterController.validateNewsletter);
router.get("/cancelNewsletter", newsletterController.cancelNewsletter);

export { router as newsletterRouter };
