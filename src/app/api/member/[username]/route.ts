import { getServerSession } from "next-auth";

import { updateMember } from "../updateMember";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { memberValidateInfoSchema } from "@/models/actions/member";
import { EmailStatusCode } from "@/models/member";
import { isPublicServiceEmail, isAdminEmail } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import {
  AdminEmailNotAllowedError,
  withHttpErrorHandling,
} from "@/utils/error";
import { getBossClientInstance } from "@/server/queueing/client";
import { createDimailMailboxTopic } from "@/server/queueing/workers/create-dimail-mailbox";

// triggered when the user verifies its new membership
async function verifyMemberHandler(
  req: Request,
  { params: { username } }: { params: { username: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.id !== username) {
    throw new Error(`You don't have the right to access this function`);
  }
  const memberData = memberValidateInfoSchema.parse(await req.json());

  const hasPublicServiceEmail = await isPublicServiceEmail(
    memberData.secondary_email,
  );
  if (hasPublicServiceEmail && isAdminEmail(memberData.secondary_email)) {
    throw new AdminEmailNotAllowedError();
  }
  await updateMember(
    memberData,
    session.user.uuid,
    {
      // todo: why ?
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

  const dbUser = await getUserInfos({
    username,
    options: { withDetails: true },
  });

  if (!dbUser) {
    throw new Error(`User ${username} not found`);
  }

  if (!hasPublicServiceEmail) {
    // create email only for non-public emails
    const bossClient = await getBossClientInstance();
    await bossClient.send(
      createDimailMailboxTopic,
      {
        userUuid: dbUser.uuid,
        username: dbUser.username,
      },
      {
        retryLimit: 50,
        retryBackoff: true,
      },
    );
  }

  return Response.json({
    message: `Success`,
    data: dbUser,
  });
}
export const PUT = withHttpErrorHandling(verifyMemberHandler);
