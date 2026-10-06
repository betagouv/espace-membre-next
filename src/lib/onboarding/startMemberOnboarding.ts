// [IMPORTANT] no "use server" here : this must never be exposed as a server
// action. Callers (createMember, validateNewMember) check authorizations first.

import { findUsersUsingEmail } from "@/lib/auth/findUsersByLoginEmail";
import { sendNewMemberVerificationEmail } from "@/lib/email/send-verification-email";
import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { BusinessError } from "@/lib/error";
import { isPublicServiceEmail } from "@/lib/utils";
import { EmailStatusCode } from "@/models/member";
import { getBossClientInstance } from "@/server/queueing/client";
import { createDimailMailboxTopic } from "@/server/queueing/workers/create-dimail-mailbox";

/*

démarre l'arrivée d'un membre accepté (validé par l'incubateur ou créé par
une personne autorisée), en statut EMAIL_UNSET sans email primaire :

 - email perso : passe en EMAIL_CREATION_WAITING et crée une boite
   @beta.gouv.fr via le worker create-dimail-mailbox, qui passera en
   EMAIL_VERIFICATION_WAITING et enverra l'invitation ProConnect sur la nouvelle
   boite une fois celle-ci créée
 - email service public : cet email devient aussi l'email primaire, le statut
   passe en EMAIL_VERIFICATION_WAITING et l'invitation ProConnect y est envoyée
   tout de suite

seul l'email compte : le domaine du membre (attributaire compris) ne change rien.

EMAIL_VERIFICATION_WAITING signifie donc toujours : adresse de connexion prête,
invitation envoyée, en attente de la connexion du membre.

idempotent : ne fait rien si l'arrivée a déjà été démarrée.

si le job de création de boite ne peut pas être mis en file, le statut est
remis à EMAIL_UNSET : l'arrivée peut alors être relancée (cf validateNewMember).

*/

// statuses of an accepted member whose onboarding has not started, always
// combined with "no primary email". EMAIL_VERIFICATION_WAITING is the legacy
// value : fiches accepted before the mailbox was created at validation.
export const ONBOARDING_NOT_STARTED_STATUSES = [
  EmailStatusCode.EMAIL_UNSET,
  EmailStatusCode.EMAIL_VERIFICATION_WAITING,
];

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
