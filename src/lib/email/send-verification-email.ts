import { addEvent } from "@/lib/events";
import { getBaseUrl } from "@/lib/url";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent/actionEvent";

import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { SendNewMemberVerificationEmailSchemaType } from "@/models/jobs/member";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/lib/email/email";
import { withRetry } from "@/lib/withRetry";

// invite the new member to log in with ProConnect using their primary email
// (new @beta.gouv.fr mailbox or public service email).
// the email contains no login token : it is sent to the contact email
// (secondary_email) when there is one, the login account being the primary email.
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
  const toEmail = dbUser.secondary_email || dbUser.primary_email;
  const loginUrl = `${getBaseUrl()}/login`;

  await withRetry(
    async () => {
      await sendEmail({
        type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING,
        toEmail: [toEmail],
        variables: {
          loginEmail,
          loginUrl,
          fullname: dbUser.fullname,
        },
      });

      await addEvent({
        action_code: EventCode.EMAIL_VERIFICATION_WAITING_SENT,
        created_by_username: SYSTEM_NAME,
        action_on_username: dbUser.username,
      });
    },
    undefined,
    "verification email",
  );

  console.log(`Verification email sent for new member ${dbUser.fullname}`);
}
