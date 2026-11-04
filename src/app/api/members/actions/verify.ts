"use server";

import { getServerSession } from "next-auth";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { authOptions } from "@/lib/authoptions";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { EmailStatusCode } from "@/models/member";
import { canEditMember } from "@/lib/authorization/member";
import {
  AuthorizationError,
  BusinessError,
  withErrorHandling,
} from "@/lib/error";
import { activateWithLoginEmail } from "@/lib/onboarding/startMemberOnboarding";

export type VerifyResult = { loginEmail: string } | { mailboxPending: true };

// forces the verification of a fiche the member did not complete. The member
// verifies their own fiche with verifyNewMember.
async function verify({ uuid }: { uuid: string }): Promise<VerifyResult> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  const canEdit = await canEditMember({
    memberUuid: uuid,
    sessionUser: session.user,
  });
  if (!canEdit) {
    throw new AuthorizationError();
  }

  const user = await getUserBasicInfo({ uuid });
  if (
    !user ||
    user.primary_email_status !== EmailStatusCode.EMAIL_VERIFICATION_WAITING
  ) {
    throw new BusinessError(
      "notWaitingVerification",
      "Cette fiche n'est pas en attente de vérification.",
    );
  }

  let result: VerifyResult;
  if (user.primary_email) {
    await db
      .updateTable("users")
      .set({
        primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        primary_email_status_updated_at: new Date(),
      })
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    result = { loginEmail: user.primary_email };
  } else {
    // a fiche accepted by the former flow : no login email yet
    const activation = await activateWithLoginEmail(uuid);
    if (!activation) {
      throw new BusinessError(
        "notWaitingVerification",
        "Cette fiche n'est plus en attente de vérification.",
      );
    }
    result =
      activation === "mailbox"
        ? { mailboxPending: true }
        : { loginEmail: user.secondary_email! };
  }

  await addEvent({
    action_code: EventCode.MEMBER_VERIFIED,
    created_by_username: session.user.id,
    action_on_username: user.username,
  });
  return result;
}

export const safeVerify = withErrorHandling<
  VerifyResult,
  Parameters<typeof verify>
>(verify);
