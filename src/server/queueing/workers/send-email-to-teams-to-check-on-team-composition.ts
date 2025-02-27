import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { getUsersByStartupIds } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import { startupToModel } from "@/models/mapper";
import { memberBaseInfoSchemaType } from "@/models/member";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { BusinessError } from "@/utils/error";
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
            .leftJoin("phases", "phases.startup_id", "startups.uuid")
            .where("mailing_list", "is not", null)
            .where("phases.name", "in", ["transfer", "alumni", "success"])
            .execute()
    ).map((startup) => startupToModel(startup));
    console.log(`Will send email to ${startups.length} mailing lists`);
    const now = new Date();
    const usersByStartup = await getUsersByStartupIds(
        startups.map((startup) => startup.uuid)
    );
    for (const startup_id in usersByStartup) {
        const startup = startups.find((startup) => startup.uuid === startup_id);
        if (!startup) {
            throw new BusinessError(
                "startupShouldExists",
                "Startup should exists"
            );
        }
        const users = usersByStartup[startup_id];
        const activeStartupMembers = users
            .map((user) => {
                const member = memberBaseInfoToModel(user);
                const activeMission = member.missions.find((mission) => {
                    return (
                        now >= mission.start &&
                        (!mission.end || now <= mission.end) &&
                        mission.startups?.includes(startup_id)
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
        await sendEmail({
            type: EMAIL_TYPES.EMAIL_TEAM_COMPOSITION,
            variables: {
                activeMembers: activeStartupMembers,
                startup: startup,
                memberAccountLink: `${config.protocol}://${config.host}/account/base-info`,
            },
            toEmail: [`${startup.mailing_list}@${config.domain}`],
        });
    }
}
