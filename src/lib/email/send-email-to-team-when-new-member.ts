import { isAfter } from "date-fns/isAfter";
import { isBefore } from "date-fns/isBefore";

import { getMemberIfValidOrThrowError } from "@/server/queueing/workers/utils";
import { getUsersByStartup, getUserStartups } from "@/lib/kysely/queries/users";
import {
  SendEmailToTeamWhenNewMemberSchema,
  SendEmailToTeamWhenNewMemberSchemaType,
} from "@/models/jobs/member";
import { userStartupToModel } from "@/models/mapper";
import { missionSchemaType } from "@/models/mission";
import { startupSchemaType } from "@/models/startup";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/lib/email/email";

// Add a simple retry wrapper for email operations
async function withEmailRetry<T>(
  operation: () => Promise<T>,
  retryLimit: number = 3,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed for team notification email:`, error);
      if (attempt < retryLimit) {
        // Exponential backoff: wait 1s, 2s, 4s, etc.
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
        );
      }
    }
  }
  throw lastError || new Error("Email operation failed");
}

const hasActiveOrFuturMissionInStartup = (
  missions: missionSchemaType[],
  startupId: startupSchemaType["uuid"],
) => {
  const now = new Date();
  return missions.find(
    (mission) =>
      isBefore(now, mission.end ?? Infinity) &&
      mission.startups?.includes(startupId),
  );
};

export async function sendEmailToTeamWhenNewMember(
  data: SendEmailToTeamWhenNewMemberSchemaType,
) {
  const validatedData = SendEmailToTeamWhenNewMemberSchema.parse(data);
  const newMember = await getMemberIfValidOrThrowError(validatedData.userId);
  const now = new Date();
  // also fetch startups from missions in the futur
  const userStartups = (await getUserStartups(validatedData.userId)).filter(
    (startup) => {
      return isBefore(now, startup.end ?? Infinity);
    },
  );

  if (!userStartups.length) {
    console.log("User is not link to any startup");
    return;
  }

  for (const startup of userStartups) {
    // get all active startups members without the new member
    const startupMembers = (await getUsersByStartup(startup.uuid)).filter(
      (member) =>
        member.uuid !== validatedData.userId &&
        hasActiveOrFuturMissionInStartup(member.missions, startup.uuid),
    );
    if (!startupMembers.length) {
      console.log(`User is the only member of the startup ${startup.name}`);
      return;
    }
    const memberEmails = Array.from(
      new Set(
        startupMembers
          .map((m) => m.primary_email)
          .filter((email) => email !== null && email !== undefined),
      ),
    );

    await withEmailRetry(async () => {
      await sendEmail({
        toEmail: memberEmails,
        type: EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL,
        variables: {
          startup: userStartupToModel(startup),
          userInfos: newMember,
        },
      });
    }, 2);
    console.log(
      `Email send to startup member to inform them about ${newMember.fullname} arrival`,
    );
  }
}
