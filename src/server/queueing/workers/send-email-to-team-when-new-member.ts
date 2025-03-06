import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import {
    getUserBasicInfo,
    getUsersByStartup,
    getUserStartups,
} from "@/lib/kysely/queries/users";
import {
    SendEmailToTeamWhenNewMemberSchema,
    SendEmailToTeamWhenNewMemberSchemaType,
} from "@/models/jobs/member";
import { memberPublicInfoToModel, userStartupToModel } from "@/models/mapper";
import { missionSchemaType } from "@/models/mission";
import { startupSchemaType } from "@/models/startup";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";
import { BusinessError, NoDataError } from "@/utils/error";

export const sendEmailToTeamWhenNewMemberTopic =
    "send-email-to-team-when-new-member";

const hasActiveMissionInStartup = (
    missions: missionSchemaType[],
    startupId: startupSchemaType["uuid"]
) => {
    const now = new Date();
    return missions.find(
        (mission) =>
            isAfter(now, mission.start ?? 0) &&
            isBefore(now, mission.end ?? Infinity) &&
            mission.startups?.includes(startupId)
    );
};

export async function sendEmailToTeamWhenNewMember(
    job: PgBoss.Job<SendEmailToTeamWhenNewMemberSchemaType>
) {
    const data = SendEmailToTeamWhenNewMemberSchema.parse(job.data);
    const now = new Date();
    const memberDbData = await getUserBasicInfo({ uuid: data.userId });
    if (!memberDbData) {
        throw new NoDataError(
            `Pas de membre trouvé pour l'id : ${data.userId}`
        );
    }
    const newMember = memberPublicInfoToModel(memberDbData);
    const userMissions = await db
        .selectFrom("missions")
        .selectAll()
        .where("user_id", "=", data.userId)
        .execute();
    if (!userMissions.length) {
        throw new BusinessError(
            "NoActiveMissionForUser",
            `User ${data.userId} does not have any missions`
        );
    }
    const userStartups = (await getUserStartups(data.userId)).filter(
        (startup) => {
            return (
                isAfter(now, startup.start ?? 0) &&
                isBefore(now, startup.end ?? Infinity)
            );
        }
    );

    if (!userStartups.length) {
        console.log("User is not link to any startup");
        return;
    }

    for (const startup of userStartups) {
        // get all active startups members without the new member
        const startupMembers = (await getUsersByStartup(startup.uuid)).filter(
            (member) =>
                member.uuid !== data.userId &&
                hasActiveMissionInStartup(member.missions, startup.uuid)
        );
        if (!startupMembers.length) {
            console.log(
                `User is the only member of the startup ${startup.name}`
            );
            return;
        }
        const memberEmails = Array.from(
            new Set(
                startupMembers
                    .map((m) => m.primary_email)
                    .filter((email) => email !== null && email !== undefined)
            )
        );
        if (startup.mailing_list) {
            memberEmails.push(`${startup.mailing_list}@${config.host}`);
        }
        await sendEmail({
            toEmail: memberEmails,
            type: EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL,
            variables: {
                startup: userStartupToModel(startup),
                userInfos: newMember,
            },
        });
        console.log(
            `Email send to startup member to inform them about ${newMember.fullname} arrival`
        );
    }
}
