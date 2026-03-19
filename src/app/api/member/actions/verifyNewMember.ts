"use server";

import { getServerSession } from "next-auth";

import { updateMember } from "../updateMember";
import { memberValidateInfoSchemaType } from "@/models/actions/member";
import { EmailStatusCode } from "@/models/member";
import { isPublicServiceEmail, isAdminEmail } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { AdminEmailNotAllowedError, AuthorizationError } from "@/utils/error";
import { getBossClientInstance } from "@/server/queueing/client";
import { createDimailMailboxTopic } from "@/server/queueing/workers/create-dimail-mailbox";

// when the user verifies its membership (from AccountVerifyClientPage)
export async function verifyNewMember(
  memberData: memberValidateInfoSchemaType & { username: string },
): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.id !== memberData.username) {
    throw new AuthorizationError();
  }
  const hasPublicServiceEmail = await isPublicServiceEmail(
    memberData.secondary_email,
  );
  if (hasPublicServiceEmail && isAdminEmail(memberData.secondary_email)) {
    throw new AdminEmailNotAllowedError();
  }
  // should create a new email account if not a public sector email

  const createNewEmail = !hasPublicServiceEmail;

  await updateMember(
    memberData,
    session.user.uuid,
    {
      // switch user secondary_email to primary if public sector email
      primary_email: createNewEmail ? null : memberData.secondary_email,
      secondary_email: createNewEmail ? memberData.secondary_email : null,
      // set email as EMAIL_CREATION_WAITING if secondary_email is not a public sector email
      primary_email_status: createNewEmail
        ? EmailStatusCode.EMAIL_CREATION_WAITING
        : EmailStatusCode.EMAIL_ACTIVE,
      primary_email_status_updated_at: new Date(),
    },
    session.user.id,
  );

  // create an email if secondary_email is not a public sector email
  if (!hasPublicServiceEmail) {
    const bossClient = await getBossClientInstance();
    await bossClient.send(
      createDimailMailboxTopic,
      {
        userUuid: session.user.uuid,
        username: memberData.username,
      },
      {
        retryLimit: 5,
        retryBackoff: true,
      },
    );
  }

  return {
    success: true,
    message: "L'utilisateur a bien été vérifié",
  };
}
