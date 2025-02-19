import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { getUsersByStartup } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import { startupToModel } from "@/models/mapper";
import { memberBaseInfoSchemaType } from "@/models/member";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@modules/email";

export const sendEmailToTeamsToCheckOnTeamCompositionTopic =
    "send-email-to-teams-to-check-on-team-composition";

export async function sendEmailToTeamsToCheckOnTeamComposition(
    job: PgBoss.Job<void>
) {
    const startups = await (
        await db
            .selectFrom("startups")
            .selectAll()
            .where("mailing_list", "is not", "null")
            .execute()
    ).map((startup) => startupToModel(startup));

    console.log(`Will send email to ${startups.length} mailing lists`);
    const now = new Date();
    for (const startup of startups) {
        const activeStartupMembers = (await getUsersByStartup(startup.uuid))
            .map((user) => {
                const member = memberBaseInfoToModel(user);
                const activeMission = member.missions.find((mission) => {
                    return (
                        now >= mission.start &&
                        (!mission.end || now <= mission.end) &&
                        mission.startups?.includes(startup.uuid)
                    );
                });
                if (!activeMission) return null; // Explicitly return null if no mission

                return {
                    member,
                    activeMission,
                };
            })
            .filter(
                (
                    member
                ): member is {
                    member: memberBaseInfoSchemaType;
                    activeMission: memberBaseInfoSchemaType["missions"][0];
                } => member !== null
            );
        try {
            await sendEmail({
                type: EMAIL_TYPES.EMAIL_TEAM_COMPOSITION,
                variables: {
                    activeMembers: activeStartupMembers,
                    startup: startup,
                    memberAccountLink: `${config.protocol}://${config.host}/account/base-info`,
                },
                toEmail: [`${startup.mailing_list}@beta.gouv.fr`],
            });
        } catch (e) {
            console.error(e);
        }
    }
}
