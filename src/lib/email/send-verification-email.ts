import { addEvent } from "@/lib/events";
import { getBaseUrl } from "@/lib/url";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent/actionEvent";

import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { SendNewMemberVerificationEmailSchemaType } from "@/models/jobs/member";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/lib/email/email";
import { withRetry } from "@/lib/withRetry";

// sent to the primary email, never the personal one : the member finds it when
// first opening the new mailbox.
export async function sendNewMemberVerificationEmail(
  data: SendNewMemberVerificationEmailSchemaType,
) {
  const dbUser = await getUserBasicInfo({ uuid: data.userId });
  if (!dbUser) {
    throw new Error(
      `sendNewMemberVerificationEmail: user ${data.userId} not found`,
    );
  }
  if (!dbUser.primary_email) {
    throw new Error(
      `sendNewMemberVerificationEmail: primary email for user ${data.userId} not found`,
    );
  }
  const loginEmail = dbUser.primary_email;
  const loginUrl = `${getBaseUrl()}/login`;

  await withRetry(
    () =>
      sendEmail({
        type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING,
        toEmail: [loginEmail],
        variables: {
          loginEmail,
          loginUrl,
          fullname: dbUser.fullname,
        },
      }),
    { operationName: "verification email" },
  );

  await addEvent({
    action_code: EventCode.EMAIL_VERIFICATION_WAITING_SENT,
    created_by_username: SYSTEM_NAME,
    action_on_username: dbUser.username,
  });

  console.log(`Verification email sent for new member ${dbUser.fullname}`);
}
