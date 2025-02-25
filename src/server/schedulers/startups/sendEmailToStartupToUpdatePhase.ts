import { Startups } from "@/@types/db";
import { db } from "@/lib/kysely";
import { startupToModel } from "@/models/mapper";
import {
    ACTIVE_PHASES,
    PHASE_READABLE_NAME,
    startupSchemaType,
} from "@/models/startup";
import routes from "@/routes/routes";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@modules/email";

export const sendEmailToStartupToUpdatePhase = async (
    startupsArg?: startupSchemaType[]
) => {
    const startups =
        startupsArg ||
        (
            await db
                .selectFrom("startups")
                .selectAll()
                .where("mailing_list", "is not", null)
                .execute()
        ).map((startup) => startupToModel(startup));
    // .whereIn("current_phase", ACTIVE_PHASES)
    // .whereNotNull("mailing_list"));
    const startupPhases = await db
        .selectFrom("phases")
        .where(
            "startup_id",
            "in",
            startups.map((s) => s.uuid)
        )
        .where("end", "is", null)
        .where("name", "in", ACTIVE_PHASES)
        .groupBy("startup_id")
        .selectAll()
        .execute();
    console.log(`Will send email to ${startups.length} mailing lists`);

    for (const startup of startups) {
        const phase = startupPhases
            .filter((phase) => phase.startup_id === startup.uuid)
            .sort((a, b) => {
                return b.start.getTime() - a.start.getTime();
            })
            .map((phase) => phase.name)[0];
        try {
            await sendEmail({
                type: EMAIL_TYPES.EMAIL_STARTUP_ASK_PHASE,
                variables: {
                    phase,
                    readablePhase: PHASE_READABLE_NAME[phase],
                    startup: startup.name,
                    link: `https://espace-membre.incubateur.net/${routes.STARTUP_GET_INFO_UPDATE_FORM.replace(
                        ":startup",
                        startup.uuid
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
