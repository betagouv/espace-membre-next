import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";
import PgBoss from "pg-boss";

import { getMemberIfValidOrThrowError } from "./utils";
import { getIncubator } from "@/lib/kysely/queries/incubators";
import { getIncubatorTeamMembers } from "@/lib/kysely/queries/teams";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import {
    SendNewMemberValidationEmailSchema,
    SendNewMemberValidationEmailSchemaType,
} from "@/models/jobs/member";
import { incubatorToModel, userStartupToModel } from "@/models/mapper";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";
import { BusinessError } from "@/utils/error";

export const sendNewMemberValidationEmailTopic =
    "send-new-member-validation-email";

export async function sendNewMemberValidationEmail(
    job: PgBoss.Job<SendNewMemberValidationEmailSchemaType>,
) {
    const data = SendNewMemberValidationEmailSchema.parse(job.data);
    const newMember = await getMemberIfValidOrThrowError(data.userId);
    const now = new Date();
    // we fetch also startups for missions in the futur
    const userStartups = (await getUserStartups(data.userId)).filter(
        (startup) => {
            return isBefore(now, startup.end ?? Infinity);
        },
    );

    const startupIncubatorIds = userStartups
        .map((startup) => startup.incubator_id)
        .filter((incubator): incubator is string => !!incubator);

    const incubatorIds = Array.from(
        new Set(
            [data.incubator_id, ...startupIncubatorIds].filter(
                (id): id is string => typeof id === "string",
            ),
        ),
    );
    if (!incubatorIds.length) {
        throw new BusinessError(
            "NewMemberDoesNotHaveIncubators",
            `NewMember ${data.userId} is not linked to any incubators`,
        );
    }
    for (const incubatorId of incubatorIds) {
        const incubator = await getIncubator(incubatorId);
        if (!incubator) {
            throw new BusinessError(
                "incubatorDoesNotExist",
                `The provided incubator id ${incubatorId} does not exist. Incubator might have been deleted`,
            );
        }
        const membersForTeam = await getIncubatorTeamMembers(incubatorId);
        if (!membersForTeam.length) {
            throw new BusinessError(
                "validationMemberListIsEmpty",
                `There is no member in animation teams for incubator ${incubatorId}`,
            );
        }
        const memberEmails = Array.from(
            new Set(
                membersForTeam
                    .map((m) => m.primary_email)
                    .filter((email) => !!email),
            ),
        ) as string[];
        await sendEmail({
            toEmail: memberEmails,
            type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
            variables: {
                startups: userStartups.map((startup) =>
                    userStartupToModel(startup),
                ),
                incubator: incubatorToModel(incubator),
                userInfos: newMember,
                validationLink: `${config.protocol}://${config.host}/community/${newMember.username}/validate`,
            },
        });
        console.log(
            `Validation email sent for new member ${newMember.fullname}`,
        );
    }
}
