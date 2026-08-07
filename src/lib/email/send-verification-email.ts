import { randomBytes } from "node:crypto";

import { addEvent } from "@/lib/events";
import { hashToken } from "@/lib/auth/hashToken";
import { createVerificationToken } from "@/lib/pgAdpter";
import { getBaseUrl } from "@/lib/url";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent/actionEvent";

import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { SendNewMemberVerificationEmailSchemaType } from "@/models/jobs/member";
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
      console.error(`Attempt ${attempt} failed for verification email:`, error);
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

export async function sendNewMemberVerificationEmail(
  data: SendNewMemberVerificationEmailSchemaType,
) {
  const dbUser = await getUserBasicInfo({ uuid: data.userId });
  if (!dbUser) {
    throw new Error(
      `sendNewMemberVerificationEmail: user ${data.userId} not found`,
    );
  }
  if (!dbUser.secondary_email) {
    throw new Error(
      `sendNewMemberVerificationEmail: secondary email for user ${data.userId} not found`,
    );
  }
  const now = Date.now();
  const token = randomBytes(32).toString("hex");

  const generateToken = await hashToken(token, config.secret);
  await createVerificationToken({
    identifier: dbUser.secondary_email!,
    expires: new Date(now + 1000 * 60 * 60 * 72),
    token: generateToken,
  });
  const url = new URL(`${getBaseUrl()}/signin`);
  url.searchParams.set("callbackUrl", `${getBaseUrl()}/dashboard`);
  url.searchParams.set("token", token);
  url.searchParams.set("email", dbUser.secondary_email!);

  await withEmailRetry(async () => {
    await sendEmail({
      type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING,
      toEmail: [dbUser.secondary_email!],
      variables: {
        secondaryEmail: dbUser.secondary_email!,
        secretariatUrl: url.toString(),
        fullname: dbUser.fullname,
      },
    });

    await addEvent({
      action_code: EventCode.EMAIL_VERIFICATION_WAITING_SENT,
      created_by_username: SYSTEM_NAME,
      action_on_username: dbUser.username,
    });
  }, 5);

  console.log(`Verification email sent for new member ${dbUser.fullname}`);
}
