import config from "@/server/config";
import * as Sentry from "@sentry/node";

export async function getConfirmation(req, res) {
    try {
        const { prNumber } = req.params;
        const { isEmailBetaAsked } = req.query;
        const prUrl = `https://github.com/${config.githubRepository}/pull/${prNumber}`;
        res.render("onboardingSuccess", { prUrl, isEmailBetaAsked });
    } catch (err) {
        console.error(err);
        Sentry.captureException(err);
        res.redirect("/");
    }
}
