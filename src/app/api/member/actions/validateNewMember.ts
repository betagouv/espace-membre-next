"use server";

import { getServerSession } from "next-auth/next";

import { addEvent, getLastEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { EventCode, EventMemberCreatedPayload } from "@/models/actionEvent";
import { validateNewMemberSchemaType } from "@/models/actions/member";
import { SendEmailToTeamWhenNewMemberSchema } from "@/models/jobs/member";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { isSessionUserIncubatorTeamAdminForUser } from "@/server/config/admin.config";
import { getBossClientInstance } from "@/server/queueing/client";
import { sendEmailToTeamWhenNewMemberTopic } from "@/server/queueing/workers/send-email-to-team-when-new-member";
import { authOptions } from "@/utils/authoptions";
import {
  AuthorizationError,
  BusinessError,
  withErrorHandling,
} from "@/utils/error";

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

  const eventMemberCreated = await getLastEvent(
    rawData.username,
    EventCode.MEMBER_CREATED,
  );
  if (!eventMemberCreated) {
    throw new BusinessError(
      "userMemberCreatedEventNotFound",
      `L'événement de création du membre n'as pas été trouvé pour ${memberUuid}.`,
    );
  }
  const eventMemberCreatedData =
    EventMemberCreatedPayload.safeParse(eventMemberCreated);
  if (!eventMemberCreatedData.success) {
    console.log(eventMemberCreatedData.error);
    throw new BusinessError(
      "eventMemberCreatedEventDoesNotHaveTheExpectedFormat",
      `L'événement de création du membre ${memberUuid} n'as pas le format attendu.`,
    );
  }
  const incubator_id = eventMemberCreatedData.data.action_metadata.incubator_id;
  const event = await db
    .selectFrom("events")
    .selectAll()
    .where("action_on_username", "=", rawData.username)
    .where("action_code", "=", EventCode.MEMBER_VALIDATED)
    .orderBy("created_at desc")
    .executeTakeFirst();

  if (event) {
    throw new BusinessError(
      "userAlreadyValided",
      `Le nouveau membre a déjà été validé par ${event.created_by_username}`,
    );
  }
  if (
    rawData.primary_email_status !== EmailStatusCode.MEMBER_VALIDATION_WAITING
  ) {
    throw new BusinessError(
      "userAlreadyValided",
      `Ce membre a déjà été validé`,
    );
  }
  const newMember = memberBaseInfoToModel(rawData);
  const sessionUserIsFromIncubatorTeam =
    !!session.user.isAdmin ||
    (await isSessionUserIncubatorTeamAdminForUser({
      user: newMember,
      sessionUserUuid: session.user.uuid,
      incubator_id: incubator_id || undefined,
    }));
  if (!sessionUserIsFromIncubatorTeam) {
    throw new BusinessError(
      "sessionUserNotAdminOrNotInRequiredIncubatorTeam",
      "Tu n'as pas les droits pour valider ce membre. Tu n'es pas dans l'équipe transverse de l'incubateur dont ce membre fait partie.",
    );
  }

  // todo check that it is authorized
  await db
    .updateTable("users")
    .where("uuid", "=", memberUuid)
    .set({
      primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
    })
    .execute();

  await addEvent({
    created_by_username: session.user.id,
    action_code: EventCode.MEMBER_VALIDATED,
    action_on_username: newMember.username,
  });

  const bossClient = await getBossClientInstance();
  await bossClient.send(
    sendEmailToTeamWhenNewMemberTopic,
    SendEmailToTeamWhenNewMemberSchema.parse({
      userId: newMember.uuid,
    }),
    {
      retryLimit: 2,
      retryBackoff: true,
    },
  );
}

export const safeValidateNewMember = withErrorHandling(validateNewMember);
