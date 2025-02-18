import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import PgBoss from "pg-boss";

import { Startups } from "@/@types/db";
import { db } from "@/lib/kysely";
import { db } from "@/lib/kysely";
import { getIncubator } from "@/lib/kysely/queries/incubators";
import { getUsersByIncubatorId } from "@/lib/kysely/queries/teams";
import { getUserBasicInfo, getUsersByStartup, getUserStartups } from "@/lib/kysely/queries/users";
import {
    SendNewMemberValidationEmailSchema,
    SendNewMemberValidationEmailSchemaType,
} from "@/models/jobs/member";
import {
    incubatorToModel,
    memberBaseInfoToModel,
    memberPublicInfoToModel,
    userStartupToModel,
} from "@/models/mapper";
import { startupToModel } from "@/models/mapper";
import {
    ACTIVE_PHASES,
    PHASE_READABLE_NAME,
    startupSchemaType,
} from "@/models/startup";
import routes from "@/routes/routes";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";
import { BusinessError, NoDataError } from "@/utils/error";
import { EMAIL_TYPES } from "@modules/email";
import { memberBaseInfoSchema, memberBaseInfoSchemaType } from "@/models/member";
import { missionSchemaType } from "@/models/mission";
export const sendNewMemberValidationEmailTopic =
    "send-new-member-validation-email";

export async function sendEmailToTeamsToCheckOnTeamComposition(
    job: PgBoss.Job<void>
) {

        const startups = await (await db
            .selectFrom("startups")
            .selectAll()
            .where("mailing_list", "is not", "null")
            .execute())
            .map((startup) => startupToModel(startup));

        console.log(`Will send email to ${startups.length} mailing lists`);
        const now = new Date()
        for (const startup of startups) {
            const activeStartupMembers = (await getUsersByStartup(startup.uuid))
                    .map((user) => {
                        const member = memberBaseInfoToModel(user)
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
                            activeMission
                    }}).filter((member): member is { member: memberBaseInfoSchemaType, activeMission: memberBaseInfoSchemaType['missions'][0]} => typeof member !== null)
            try {
                await sendEmail({
                    type: EMAIL_TYPES.EMAIL_TEAM_COMPOSITION,
                    variables: {
                        activeMembers: activeStartupMembers,
                        startup: startup,
                        memberAccountLink: '',
                    },
                    toEmail: [`${startup.mailing_list}@beta.gouv.fr`],
                });
            } catch (e) {
                console.error(e);
            }
        }
    };
}
