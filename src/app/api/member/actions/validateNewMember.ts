"use server";

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
import { startMemberOnboarding } from "@/lib/onboarding/startMemberOnboarding";

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

  // atomic transition : a second (concurrent) validation updates nothing
  const result = await db
    .updateTable("users")
    .set({
      primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
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

  await sendEmailToTeamWhenNewMember(
    SendEmailToTeamWhenNewMemberSchema.parse({
      userId: rawData.uuid,
    }),
  );

  await startMemberOnboarding(rawData.uuid);
}

export const safeValidateNewMember = withErrorHandling(validateNewMember);
