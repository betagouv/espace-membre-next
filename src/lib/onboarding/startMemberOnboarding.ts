// [IMPORTANT] no "use server" here : this must never be exposed as a server
// action. Callers (createMember, validateNewMember) check authorizations first.

import { findUsersUsingEmail } from "@/lib/auth/findUsersByLoginEmail";
import { sendNewMemberVerificationEmail } from "@/lib/email/send-verification-email";
import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { BusinessError } from "@/lib/error";
import { isPublicServiceEmail } from "@/lib/utils";
import { Domaine, EmailStatusCode } from "@/models/member";
import { getBossClientInstance } from "@/server/queueing/client";
import { createDimailMailboxTopic } from "@/server/queueing/workers/create-dimail-mailbox";

/*

démarre l'arrivée d'un membre accepté (validé par l'incubateur ou créé par
une personne autorisée), en statut EMAIL_VERIFICATION_WAITING sans email primaire :

 - email perso (hors attributaire) : crée une boite @beta.gouv.fr via le worker
   create-dimail-mailbox, qui enverra l'invitation ProConnect une fois la boite créée
 - email service public ou attributaire : cet email devient aussi l'email
   primaire et l'invitation ProConnect est envoyée tout de suite

idempotent : ne fait rien si l'arrivée a déjà été démarrée.

si le job de création de boite ne peut pas être mis en file, le statut est
remis à EMAIL_VERIFICATION_WAITING : l'arrivée peut alors être relancée
(cf validateNewMember).

*/
export async function startMemberOnboarding(userUuid: string) {
  const dbUser = await getUserBasicInfo({ uuid: userUuid });
  if (!dbUser) {
    throw new Error(`startMemberOnboarding: user ${userUuid} not found`);
  }
  if (!dbUser.secondary_email) {
    throw new Error(`startMemberOnboarding: user ${userUuid} has no email`);
  }
  const needsMailbox =
    !(await isPublicServiceEmail(dbUser.secondary_email)) &&
    dbUser.domaine !== Domaine.ATTRIBUTAIRE;

  if (needsMailbox) {
    const result = await db
      .updateTable("users")
      .set({
        primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
        primary_email_status_updated_at: new Date(),
      })
      .where("uuid", "=", userUuid)
      .where(
        "primary_email_status",
        "=",
        EmailStatusCode.EMAIL_VERIFICATION_WAITING,
      )
      .where("primary_email", "is", null)
      .executeTakeFirst();
    if (!Number(result.numUpdatedRows)) {
      console.log(`startMemberOnboarding: already started for ${userUuid}`);
      return;
    }
    // the ProConnect invitation is sent by the worker, once the mailbox exists
    try {
      const bossClient = await getBossClientInstance();
      const jobId = await bossClient.send(
        createDimailMailboxTopic,
        {
          userUuid,
          username: dbUser.username,
          onboarding: true,
        },
        {
          retryLimit: 5,
          retryBackoff: true,
        },
      );
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
          primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
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

  // the public service email becomes the login email : it must not belong to someone else
  const otherUsers = await findUsersUsingEmail(dbUser.secondary_email, {
    excludeUserUuid: userUuid,
  });
  if (otherUsers.length) {
    throw new BusinessError(
      "emailAlreadyUsed",
      `L'email ${dbUser.secondary_email} est déjà utilisé par un autre membre.`,
    );
  }
  const result = await db
    .updateTable("users")
    .set({
      // also kept as secondary (contact) email : it is required by the verify form
      primary_email: dbUser.secondary_email,
      primary_email_status_updated_at: new Date(),
    })
    .where("uuid", "=", userUuid)
    .where(
      "primary_email_status",
      "=",
      EmailStatusCode.EMAIL_VERIFICATION_WAITING,
    )
    .where("primary_email", "is", null)
    .executeTakeFirst();
  if (!Number(result.numUpdatedRows)) {
    console.log(`startMemberOnboarding: already started for ${userUuid}`);
    return;
  }
  await sendNewMemberVerificationEmail({ userId: userUuid });
}
