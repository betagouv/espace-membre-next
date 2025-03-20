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
    const startups = (
        await db
            .selectFrom("startups")
            .selectAll(["startups"])
            .leftJoin("phases", (join) =>
                join
                    .onRef("phases.startup_id", "=", "startups.uuid")
                    .on("phases.name", "in", ["success", "transfer", "alumni"])
            )
            .where("phases.name", "is", null)
            .execute()
    ).map((startup) => startupToModel(startup));

    if (!startups.length) {
        console.log(`There is no startups in active startups`);
        return;
    }
    console.log(`Will send email to ${startups.length} startups`);
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
        const memberEmails = activeStartupMembers
            .map((member) => member.member.primary_email)
            .filter((email) => email !== null);
        await sendEmail({
            type: EMAIL_TYPES.EMAIL_TEAM_COMPOSITION,
            variables: {
                activeMembers: activeStartupMembers,
                startup: startup,
                memberAccountLink: `${config.protocol}://${config.host}/account/base-info`,
            },
            toEmail: memberEmails,
        });
    }
}
