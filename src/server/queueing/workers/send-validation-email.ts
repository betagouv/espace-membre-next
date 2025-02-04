import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { getUsersByIncubatorId } from "@/lib/kysely/queries/teams";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import {
    SendNewMemberValidationEmailSchema,
    SendNewMemberValidationEmailSchemaType,
} from "@/models/jobs/member";
import { memberPublicInfoToModel } from "@/models/mapper";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";
import { BusinessError, NoDataError } from "@/utils/error";

export const sendNewMemberValidationEmailTopic =
    "send-new-member-validation-email";

export async function sendNewMemberValidationEmail(
    job: PgBoss.Job<SendNewMemberValidationEmailSchemaType>
) {
    const data = SendNewMemberValidationEmailSchema.parse(job);
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
    // todo incubator_id might change to be another params send in object "job"
    const missionIncubators = userMissions
        .map((m) => m.incubator_id)
        .filter((incubator) => !!incubator);
    const startupIncubators = userStartups.map(
        (startup) => startup.incubator_id
    );
    const incubatorIds = [...missionIncubators, ...startupIncubators];

    for (const incubatorId in incubatorIds) {
        const incubator = await db
            .selectFrom("incubators")
            .selectAll()
            .where("uuid", "=", incubatorId)
            .executeTakeFirst();
        if (!incubator) {
            throw new BusinessError(
                "incubatorDoesNotExist",
                `The provided incubator id ${incubatorId} does not exist. Incubator might have been deleted`
            );
        }
        const membersForTeam = await getUsersByIncubatorId(incubatorId);
        if (!membersForTeam.length) {
            throw new BusinessError(
                "validationMemberListIsEmpty",
                `There is no member in animation team for incubator ${incubatorId}`
            );
        }
        const memberEmails = Array.from(
            new Set(
                membersForTeam
                    .map((m) => m.primary_email)
                    .filter((email) => !!email)
            )
        ) as string[];
        await sendEmail({
            toEmail: memberEmails,
            type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
            variables: {
                newMember,
                incubatorName: incubator.title,
            },
        });
        console.log(
            `Validation email sent for new member ${newMember.fullname}`
        );
    }
}
