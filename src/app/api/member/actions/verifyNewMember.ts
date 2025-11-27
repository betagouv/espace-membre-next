"use server";

import { getServerSession } from "next-auth";

import { updateMember } from "../updateMember";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberValidateInfoSchemaType } from "@/models/actions/member";
import { EmailStatusCode } from "@/models/member";
import { isPublicServiceEmail, isAdminEmail } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { AdminEmailNotAllowedError } from "@/utils/error";
import { getBossClientInstance } from "@/server/queueing/client";
import { createDimailMailboxTopic } from "@/server/queueing/workers/create-dimail-mailbox";

// when the user verifies its membership (from AccountVerifyClientPage)
export async function verifyNewMember(
  memberData: memberValidateInfoSchemaType & { username: string },
): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.id !== memberData.username) {
    throw new Error(`You don't have the right to access this function`);
  }
  const hasPublicServiceEmail = await isPublicServiceEmail(
    memberData.secondary_email,
  );
  if (hasPublicServiceEmail && isAdminEmail(memberData.secondary_email)) {
    throw new AdminEmailNotAllowedError();
  }
  updateMember(
    memberData,
    session.user.uuid,
    {
      primary_email: hasPublicServiceEmail ? memberData.secondary_email : null,
      secondary_email: hasPublicServiceEmail
        ? null
        : memberData.secondary_email,
      primary_email_status: hasPublicServiceEmail
        ? EmailStatusCode.EMAIL_ACTIVE
        : EmailStatusCode.EMAIL_CREATION_WAITING,
    },
    session.user.id,
  );

  if (!hasPublicServiceEmail) {
    const userData = await getUserBasicInfo({ username: memberData.username });
    if (!userData) {
      throw new Error(
        `The user ${memberData.username} has not been found in database`,
      );
    }
    const bossClient = await getBossClientInstance();
    await bossClient.send(
      createDimailMailboxTopic,
      {
        userUuid: userData.uuid,
        username: memberData.username,
      },
      {
        retryLimit: 50,
        retryBackoff: true,
      },
    );
  }

  return {
    success: true,
    message: "L'utilisateur a bien été vérifié",
  };
}
