import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";

import { getMemberIfValidOrThrowError } from "@/server/queueing/workers/utils";
import { getIncubator } from "@/lib/kysely/queries/incubators";
import { getIncubatorTeamMembers } from "@/lib/kysely/queries/teams";
import { getUserStartups } from "@/lib/kysely/queries/users";
import {
  SendNewMemberValidationEmailSchema,
  SendNewMemberValidationEmailSchemaType,
} from "@/models/jobs/member";
import { incubatorToModel, userStartupToModel } from "@/models/mapper";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/lib/email/email";
import { BusinessError } from "@/lib/error";
import { withRetry } from "@/lib/withRetry";

export async function sendNewMemberValidationEmail(
  data: SendNewMemberValidationEmailSchemaType,
) {
  const validatedData = SendNewMemberValidationEmailSchema.parse(data);
  const newMember = await getMemberIfValidOrThrowError(validatedData.userId);
  const now = new Date();
  // we fetch also startups for missions in the futur
  const userStartups = (await getUserStartups(validatedData.userId)).filter(
    (startup) => {
      return isBefore(now, startup.end ?? Infinity);
    },
  );

  const startupIncubatorIds = userStartups
    .map((startup) => startup.incubator_id)
    .filter((incubator): incubator is string => !!incubator);

  const incubatorIds = Array.from(
    new Set(
      [validatedData.incubator_id, ...startupIncubatorIds].filter(
        (id): id is string => typeof id === "string",
      ),
    ),
  );
  if (!incubatorIds.length) {
    throw new BusinessError(
      "NewMemberDoesNotHaveIncubators",
      `NewMember ${validatedData.userId} is not linked to any incubators`,
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
        membersForTeam.map((m) => m.primary_email).filter((email) => !!email),
      ),
    ) as string[];

    await withRetry(async () => {
      await sendEmail({
        toEmail: memberEmails,
        type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
        variables: {
          startups: userStartups.map((startup) => userStartupToModel(startup)),
          incubator: incubatorToModel(incubator),
          userInfos: newMember,
          validationLink: `${config.protocol}://${config.host}/community/${newMember.username}/validate`,
        },
      });
    }, undefined, "validation email");
    console.log(`Validation email sent for new member ${newMember.fullname}`);
  }
}
