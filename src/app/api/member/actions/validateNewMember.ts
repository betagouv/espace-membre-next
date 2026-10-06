"use server";

import * as Sentry from "@sentry/nextjs";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { addEvent, getLastEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent";
import { validateNewMemberSchemaType } from "@/models/actions/member";
import { SendEmailToTeamWhenNewMemberSchema } from "@/models/jobs/member";
import { EmailStatusCode } from "@/models/member";
import { authOptions } from "@/lib/authoptions";
import {
  AuthorizationError,
  BusinessError,
  withErrorHandling,
} from "@/lib/error";
import { sendEmailToTeamWhenNewMember } from "@/lib/email/send-email-to-team-when-new-member";
import { canEditMember } from "@/lib/canEditMember";
import {
  ONBOARDING_NOT_STARTED_STATUSES,
  startMemberOnboarding,
} from "@/lib/onboarding/startMemberOnboarding";
import { checkUserIsExpired } from "@/lib/utils";
import { memberBaseInfoSchemaType } from "@/models/member";

const MemberCreatedIncubatorSchema = z.object({
  action_metadata: z.object({
    incubator_id: z.string().nullish(),
  }),
});

export async function validateNewMember({
  memberUuid,
}: validateNewMemberSchemaType): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  const rawData = await getUserBasicInfo({ uuid: memberUuid });
  if (!rawData) {
    throw new BusinessError(
      "userNotFound",
      `Aucun utilisateur trouvé pour l'identifiant : ${memberUuid}`,
    );
  }

  // the incubator chosen at invitation is only stored in the MEMBER_CREATED event.
  // it is optional : it only adds a way to be authorized (fail-closed).
  // only parse incubator_id so an old event with outdated missions data still works
  const eventMemberCreated = MemberCreatedIncubatorSchema.safeParse(
    await getLastEvent(rawData.username, EventCode.MEMBER_CREATED),
  );
  const incubator_id = eventMemberCreated.success
    ? eventMemberCreated.data.action_metadata.incubator_id
    : undefined;

  // check rights before revealing anything about the member status
  const canEdit = await canEditMember({
    memberUuid: rawData.uuid,
    sessionUser: session.user,
    incubator_id: incubator_id || undefined,
  });
  if (!canEdit) {
    throw new BusinessError(
      "sessionUserNotAdminOrNotInRequiredIncubatorTeam",
      "Tu n'as pas les droits pour valider ce membre. Tu n'es pas dans l'équipe transverse de l'incubateur dont ce membre fait partie.",
    );
  }

  // atomic transition : a second (concurrent) validation updates nothing.
  // EMAIL_UNSET : accepted, no login email yet (startMemberOnboarding takes over)
  const result = await db
    .updateTable("users")
    .set({
      primary_email_status: EmailStatusCode.EMAIL_UNSET,
      primary_email_status_updated_at: new Date(),
    })
    .where("uuid", "=", memberUuid)
    .where(
      "primary_email_status",
      "=",
      EmailStatusCode.MEMBER_VALIDATION_WAITING,
    )
    .executeTakeFirst();
  if (!Number(result.numUpdatedRows)) {
    // already validated. if the onboarding never started (ex: the mailbox job
    // could not be enqueued), opening the validation link again restarts it.
    // EMAIL_UNSET is also the status of old fiches without email : only
    // members with a current mission are concerned.
    const currentData = await getUserBasicInfo({ uuid: memberUuid });
    if (
      currentData &&
      ONBOARDING_NOT_STARTED_STATUSES.includes(
        currentData.primary_email_status as EmailStatusCode,
      ) &&
      !currentData.primary_email &&
      !checkUserIsExpired(currentData as unknown as memberBaseInfoSchemaType)
    ) {
      await startMemberOnboarding(rawData.uuid);
      return;
    }
    throw new BusinessError(
      "userAlreadyValided",
      `Ce membre a déjà été validé`,
    );
  }

  await addEvent({
    created_by_username: session.user.id,
    action_code: EventCode.MEMBER_VALIDATED,
    action_on_username: rawData.username,
  });

  await startMemberOnboarding(rawData.uuid);

  // the announcement must never block the onboarding
  try {
    await sendEmailToTeamWhenNewMember(
      SendEmailToTeamWhenNewMemberSchema.parse({
        userId: rawData.uuid,
      }),
    );
  } catch (e) {
    console.error(
      `validateNewMember: team announcement failed for ${rawData.username}`,
      e,
    );
    Sentry.captureException(e);
  }
}

export const safeValidateNewMember = withErrorHandling(validateNewMember);
