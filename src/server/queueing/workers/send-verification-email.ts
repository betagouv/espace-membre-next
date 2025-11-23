import PgBoss from "pg-boss";
import { randomBytes } from "crypto";

import { addEvent } from "@/lib/events";
import { hashToken } from "@/utils/auth/hashToken";
import { createVerificationToken } from "@/utils/pgAdpter";
import { getBaseUrl } from "@/utils/url";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent/actionEvent";

import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { SendNewMemberVerificationEmailSchemaType } from "@/models/jobs/member";
import config from "@/server/config";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";

export const sendNewMemberVerificationEmailTopic =
  "send-new-member-verification-email";

export async function sendNewMemberVerificationEmail(
  job: PgBoss.Job<SendNewMemberVerificationEmailSchemaType>,
) {
  const dbUser = await getUserBasicInfo({ uuid: job.data.userId });
  if (!dbUser) {
    throw new Error(
      `sendNewMemberVerificationEmail: user ${job.data.userId} not found`,
    );
  }
  if (!dbUser.secondary_email) {
    throw new Error(
      `sendNewMemberVerificationEmail: secondary emaiul for user ${job.data.userId} not found`,
    );
  }
  const now = Date.now();
  const token = randomBytes(32).toString("hex");

  const generateToken = await hashToken(token, config.secret);
  await createVerificationToken({
    identifier: dbUser.secondary_email,
    expires: new Date(now + 1000 * 60 * 60 * 72),
    token: generateToken,
  });
  const url = new URL(`${getBaseUrl()}/signin`);
  url.searchParams.set("callbackUrl", `${getBaseUrl()}/dashboard`);
  url.searchParams.set("token", token);
  url.searchParams.set("email", dbUser.secondary_email);

  await sendEmail({
    type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING,
    toEmail: [dbUser.secondary_email],
    variables: {
      secondaryEmail: dbUser.secondary_email,
      secretariatUrl: url.toString(),
      fullname: dbUser.fullname,
    },
  });

  await addEvent({
    action_code: EventCode.EMAIL_VERIFICATION_WAITING_SENT,
    created_by_username: SYSTEM_NAME,
    action_on_username: dbUser.username,
  });

  console.log(`Verification email sent for new member ${dbUser.fullname}`);
}
