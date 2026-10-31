// [IMPORTANT] no "use server" here : this must never be exposed as a server
// action. Callers (createMember, validateNewMember) check authorizations first.

import { findUsersUsingEmail } from "@/lib/auth/findUsersByLoginEmail";
import { DIMAIL_MAILBOX_DOMAIN } from "@/lib/dimail/utils";
import { sendNewMemberVerificationEmail } from "@/lib/email/send-verification-email";
import { getLastEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { BusinessError } from "@/lib/error";
import { isPublicServiceEmail } from "@/lib/utils";
import { EventCode } from "@/models/actionEvent";
import { EmailStatusCode } from "@/models/member";
import { getBossClientInstance } from "@/server/queueing/client";
import { createDimailMailboxTopic } from "@/server/queueing/workers/create-dimail-mailbox";

// statuses of an accepted member whose onboarding has not started, always
// combined with "no primary email". EMAIL_VERIFICATION_WAITING is the legacy
// value : fiches accepted before the mailbox was created at validation.
export const ONBOARDING_NOT_STARTED_STATUSES = [
  EmailStatusCode.EMAIL_UNSET,
  EmailStatusCode.EMAIL_VERIFICATION_WAITING,
];

// without onboarding, the worker activates the fiche once the mailbox exists
async function enqueueMailboxJob(
  userUuid: string,
  username: string,
  onboarding: boolean,
) {
  const bossClient = await getBossClientInstance();
  return bossClient.send(
    createDimailMailboxTopic,
    { userUuid, username, onboarding },
    {
      retryLimit: 5,
      retryBackoff: true,
      // no new job while one with this key is waiting or running
      singletonKey: `onboarding-mailbox-${userUuid}`,
    },
  );
}

// the public service email becomes the login email : it must not belong to someone else
async function assertLoginEmailAvailable(email: string, userUuid: string) {
  const otherUsers = await findUsersUsingEmail(email, {
    excludeUserUuid: userUuid,
  });
  if (otherUsers.length) {
    throw new BusinessError(
      "emailAlreadyUsed",
      `L'email ${email} est déjà utilisé par un autre membre.`,
    );
  }
}

// idempotent. When the mailbox job cannot be enqueued, the status goes back to
// EMAIL_UNSET so the onboarding can be resumed (validateNewMember).
export async function startMemberOnboarding(userUuid: string) {
  const dbUser = await getUserBasicInfo({ uuid: userUuid });
  if (!dbUser) {
    throw new Error(`startMemberOnboarding: user ${userUuid} not found`);
  }
  if (!dbUser.secondary_email) {
    throw new Error(`startMemberOnboarding: user ${userUuid} has no email`);
  }
  const needsMailbox = !(await isPublicServiceEmail(dbUser.secondary_email));

  if (needsMailbox) {
    const result = await db
      .updateTable("users")
      .set({
        primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
        primary_email_status_updated_at: new Date(),
      })
      .where("uuid", "=", userUuid)
      .where("primary_email_status", "in", ONBOARDING_NOT_STARTED_STATUSES)
      .where("primary_email", "is", null)
      .executeTakeFirst();
    if (!Number(result.numUpdatedRows)) {
      console.log(`startMemberOnboarding: already started for ${userUuid}`);
      return;
    }
    // the ProConnect invitation is sent by the worker, once the mailbox exists
    try {
      const jobId = await enqueueMailboxJob(userUuid, dbUser.username, true);
      if (!jobId) {
        throw new Error(
          `startMemberOnboarding: mailbox job not created for ${userUuid}`,
        );
      }
    } catch (e) {
      // no job : nothing would ever create the mailbox, so undo the transition
      // to let the onboarding be started again
      await db
        .updateTable("users")
        .set({
          primary_email_status: EmailStatusCode.EMAIL_UNSET,
          primary_email_status_updated_at: new Date(),
        })
        .where("uuid", "=", userUuid)
        .where(
          "primary_email_status",
          "=",
          EmailStatusCode.EMAIL_CREATION_WAITING,
        )
        .where("primary_email", "is", null)
        .executeTakeFirst();
      throw e;
    }
    return;
  }

  await assertLoginEmailAvailable(dbUser.secondary_email, userUuid);
  const result = await db
    .updateTable("users")
    .set({
      // also kept as secondary (contact) email : it is required by the verify form
      primary_email: dbUser.secondary_email,
      // the login email is ready : waiting for the member to log in and verify
      primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      primary_email_status_updated_at: new Date(),
    })
    .where("uuid", "=", userUuid)
    .where("primary_email_status", "in", ONBOARDING_NOT_STARTED_STATUSES)
    .where("primary_email", "is", null)
    .executeTakeFirst();
  if (!Number(result.numUpdatedRows)) {
    console.log(`startMemberOnboarding: already started for ${userUuid}`);
    return;
  }
  await sendNewMemberVerificationEmail({ userId: userUuid });
}

// resumes an onboarding stopped by a failure (job not enqueued, mailbox job
// failed for good, invitation not sent). Returns false when there is nothing
// to resume, a mailbox job still pending included. The mailbox job is
// idempotent, so enqueuing it again is safe.
export async function resumeMemberOnboarding(
  userUuid: string,
): Promise<boolean> {
  const dbUser = await getUserBasicInfo({ uuid: userUuid });
  if (!dbUser) {
    return false;
  }
  const status = dbUser.primary_email_status as EmailStatusCode;
  if (!dbUser.primary_email) {
    if (ONBOARDING_NOT_STARTED_STATUSES.includes(status)) {
      await startMemberOnboarding(userUuid);
      return true;
    }
    if (status === EmailStatusCode.EMAIL_CREATION_WAITING) {
      return !!(await enqueueMailboxJob(userUuid, dbUser.username, true));
    }
    if (status === EmailStatusCode.EMAIL_ACTIVE) {
      return !!(await activateWithLoginEmail(userUuid));
    }
    return false;
  }
  if (status !== EmailStatusCode.EMAIL_VERIFICATION_WAITING) {
    return false;
  }
  const invitationEvent = await getLastEvent(
    dbUser.username,
    EventCode.EMAIL_VERIFICATION_WAITING_SENT,
  );
  if (invitationEvent) {
    return false;
  }
  if (dbUser.primary_email.endsWith(`@${DIMAIL_MAILBOX_DOMAIN}`)) {
    // the worker waits for the new mailbox to accept emails before inviting
    return !!(await enqueueMailboxJob(userUuid, dbUser.username, true));
  }
  await sendNewMemberVerificationEmail({ userId: userUuid });
  return true;
}

const ACTIVATION_STATUSES = [
  ...ONBOARDING_NOT_STARTED_STATUSES,
  EmailStatusCode.EMAIL_ACTIVE,
];

// activates a fiche without login email and without a new verification : the
// former flows accepted, or even activated, fiches with only a contact email.
// A public service email becomes the login email, otherwise a mailbox is
// created, its webmail access sent to the contact email. Returns null when
// there is nothing to do.
export async function activateWithLoginEmail(
  userUuid: string,
): Promise<"publicServiceEmail" | "mailbox" | null> {
  const dbUser = await getUserBasicInfo({ uuid: userUuid });
  if (
    !dbUser ||
    dbUser.primary_email ||
    !dbUser.secondary_email ||
    !ACTIVATION_STATUSES.includes(
      dbUser.primary_email_status as EmailStatusCode,
    )
  ) {
    return null;
  }
  const previousStatus = dbUser.primary_email_status as EmailStatusCode;

  if (await isPublicServiceEmail(dbUser.secondary_email)) {
    await assertLoginEmailAvailable(dbUser.secondary_email, userUuid);
    const result = await db
      .updateTable("users")
      .set({
        primary_email: dbUser.secondary_email,
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        primary_email_status_updated_at: new Date(),
      })
      .where("uuid", "=", userUuid)
      .where("primary_email_status", "in", ACTIVATION_STATUSES)
      .where("primary_email", "is", null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) ? "publicServiceEmail" : null;
  }

  const result = await db
    .updateTable("users")
    .set({
      primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
      primary_email_status_updated_at: new Date(),
    })
    .where("uuid", "=", userUuid)
    .where("primary_email_status", "in", ACTIVATION_STATUSES)
    .where("primary_email", "is", null)
    .executeTakeFirst();
  if (!Number(result.numUpdatedRows)) {
    return null;
  }
  try {
    const jobId = await enqueueMailboxJob(userUuid, dbUser.username, false);
    if (!jobId) {
      throw new Error(
        `activateWithLoginEmail: mailbox job not created for ${userUuid}`,
      );
    }
  } catch (e) {
    await db
      .updateTable("users")
      .set({
        primary_email_status: previousStatus,
        primary_email_status_updated_at: new Date(),
      })
      .where("uuid", "=", userUuid)
      .where(
        "primary_email_status",
        "=",
        EmailStatusCode.EMAIL_CREATION_WAITING,
      )
      .where("primary_email", "is", null)
      .executeTakeFirst();
    throw e;
  }
  return "mailbox";
}
