import express from "express";

const router = express.Router();

// router.get(routes.ONBOARDING_API, onboardingController.getFormApi);

// // router.post(
// //     routes.ONBOARDING_ACTION,
// //     checkSchema(onboardingController.postFormSchema),
// //     onboardingController.postOnboardingForm
// // );
// router.post(
//     routes.ONBOARDING_ACTION_API,
//     checkSchema(onboardingController.postFormSchema),
//     express.json({ type: "*/*" }),
//     onboardingController.postOnboardingFormApi
// );
// router.get(
//     "/onboardingSuccess/:prNumber",
//     onboardingController.getConfirmation
// );

export { router as onboardingRouter };
