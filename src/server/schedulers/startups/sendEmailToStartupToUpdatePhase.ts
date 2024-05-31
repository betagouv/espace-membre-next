import { ACTIVE_PHASES, PHASE_READABLE_NAME } from "@/models/startup";
import routes from "@/routes/routes";
import { sendEmail } from "@/server/config/email.config";
import db from "@db";
import { EMAIL_TYPES } from "@modules/email";

export const sendEmailToStartupToUpdatePhase = async (
    startupsArg?: Startups[]
) => {
    const startups: Startups[] =
        startupsArg ||
        (await db("startups")
            .whereIn("current_phase", ACTIVE_PHASES)
            .whereNotNull("mailing_list"));
    console.log(`Will send email to ${startups.length} mailing lists`);

    for (const startup of startups) {
        const phase = startup.current_phase;
        try {
            await sendEmail({
                type: EMAIL_TYPES.EMAIL_STARTUP_ASK_PHASE,
                variables: {
                    phase,
                    readablePhase: PHASE_READABLE_NAME[phase],
                    startup: startup.name,
                    link: `https://espace-membre.incubateur.net/${routes.STARTUP_GET_INFO_UPDATE_FORM.replace(
                        ":startup",
                        startup.id
                    )}`,
                },
                forceTemplate: true,
                toEmail: [`${startup.mailing_list}@beta.gouv.fr`],
            });
        } catch (e) {
            console.error(e);
        }
    }
};
