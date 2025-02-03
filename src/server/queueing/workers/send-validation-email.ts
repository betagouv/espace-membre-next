import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { getTeam, getTeamsForIncubator } from "@/lib/kysely/queries/teams";
import { getUserStartups } from "@/lib/kysely/queries/users";
import {
    SendNewMemberValidationEmailSchema,
    SendNewMemberValidationEmailSchemaType,
} from "@/models/jobs/member";
import { memberSchemaType } from "@/models/member";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";

export const sendNewMemberValidationEmailTopic =
    "send-new-member-validation-email";

export async function sendNewMemberValidationEmail(
    job: PgBoss.Job<SendNewMemberValidationEmailSchemaType>
) {
    const data = SendNewMemberValidationEmailSchema.parse(job);
    const now = new Date();
    const userMissions = await db
        .selectFrom("missions")
        .selectAll()
        .where("start", ">", now)
        .where("end", "<", now)
        .where("user_id", "=", data.userId)
        .execute();
    const userStartups = (await getUserStartups(data.userId)).filter(
        (startup) => {
            return (
                isAfter(now, startup.start ?? 0) &&
                isBefore(now, startup.end ?? Infinity)
            );
        }
    );
    const missionIncubators = userMissions
        .map((m) => m.incubator_id)
        .filter((incubator) => !!incubator);
    const startupIncubators = userStartups.map(
        (startup) => startup.incubator_id
    );
    const incubatorIds = [...missionIncubators, ...startupIncubators];

    for (const incubatorId in incubatorIds) {
        const teams = getTeamsForIncubator(incubatorId);
        // TODO get members for tam
        const membersForTeam: memberSchemaType[] = [];
        const memberEmails = membersForTeam
            .map((m) => m.primary_email)
            .filter((email) => !!email) as string[];
        await sendEmail({
            toEmail: memberEmails,
            type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
            variables: {},
        });
    }
    // todo find referents for every incubator ids and send emails
}
