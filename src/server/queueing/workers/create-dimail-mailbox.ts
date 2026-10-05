import PgBoss from "pg-boss";
import * as Sentry from "@sentry/nextjs";

import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { CreateDimailAdressDataSchemaType } from "@/models/jobs/services";
import { EmailStatusCode } from "@/models/member";
import { createMailbox, createMailboxCode } from "@/lib/dimail/client";
import {
  getDimailUsernameForUser,
  DIMAIL_MAILBOX_DOMAIN,
} from "@/lib/dimail/utils";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/lib/email/email";
import { getLastEvent } from "@/lib/events";
import { EventCode } from "@/models/actionEvent";
import { sendNewMemberVerificationEmail } from "@/lib/email/send-verification-email";

export const createDimailMailboxTopic = "create-dimail-mailbox";

const splitFullName = (fullname: string) => {
  const [surName, ...rest] = fullname.trim().split(" ");
  return [surName, rest.join(" ")];
};

/*

créé un email dimail pour un utilisateur

 - crée l'email en prenom.nom[.ext]@domain selon le statut légal de l'utilisateur
   (ou reprend la boite déjà créée par une tentative précédente, cf dinum_emails)
 - envoie l'email de connexion à l'utilisateur
 - créé un alias pour les anciens utilisateurs
 - met à jour la table dinum_emails
 - met à jour le primary_email_status en ACTIVE

*/
export async function createDimailMailboxForUser(
  userUuid: string,
  { status = EmailStatusCode.EMAIL_ACTIVE }: { status?: EmailStatusCode } = {},
) {
  const dbUser = await getUserBasicInfo({ uuid: userUuid });
  if (!dbUser) {
    console.log(`createDimailMailboxForUser error: User ${userUuid} not found`);
    throw new Error(`User ${userUuid} not found`);
  }
  if (!dbUser.secondary_email) {
    console.log(
      `createDimailMailboxForUser error: User ${userUuid} has no secondary_email`,
    );
    throw new Error(`User ${userUuid} has no secondary_email`);
  }

  // new members have no legal_status yet : use the status of their latest mission
  const lastMission = await db
    .selectFrom("missions")
    .select("status")
    .where("user_id", "=", userUuid)
    .orderBy("start", "desc")
    .executeTakeFirst();

  const userName = getDimailUsernameForUser(
    dbUser.username,
    dbUser.legal_status,
    lastMission?.status,
  );

  console.log(
    `Create DIMAIL mailbox: ${userName}@${DIMAIL_MAILBOX_DOMAIN} for ${dbUser.fullname}`,
  );

  const [surName, givenName] = splitFullName(dbUser.fullname);

  const secondaryEmail = dbUser.secondary_email;

  // a previous attempt may have created the mailbox then failed (access code,
  // email...) : creating it again would end in a 409, so resume from the
  // mailbox recorded in dinum_emails
  const existingMailbox = await db
    .selectFrom("dinum_emails")
    .select("email")
    .where("email", "=", `${userName}@${DIMAIL_MAILBOX_DOMAIN}`)
    .where("user_id", "=", userUuid)
    .where("type", "=", "mailbox")
    .executeTakeFirst();

  let mailboxEmail: string;
  if (existingMailbox) {
    console.log(
      `DIMAIL mailbox ${existingMailbox.email} already created for ${dbUser.username}`,
    );
    mailboxEmail = existingMailbox.email;
  } else {
    const mailboxInfos = await createMailbox({
      user_name: userName,
      domain: DIMAIL_MAILBOX_DOMAIN,
      displayName: dbUser.fullname,
      givenName,
      surName,
    }).catch((e) => {
      console.error(
        `Error creating DIMAIL mailbox ${userName}@${DIMAIL_MAILBOX_DOMAIN}: ${e.status || ""} ${e.message}`,
      );
      Sentry.captureException(e);
      throw e;
    });
    mailboxEmail = mailboxInfos.email;

    // MAJ de la table dinum_emails
    // recorded right after the creation, so a retry does not create the mailbox again
    await db
      .insertInto("dinum_emails")
      .values({
        email: mailboxEmail,
        type: "mailbox",
        status: "ok",
        user_id: userUuid,
      })
      .onConflict((oc) => oc.column("email").doUpdateSet({ status: "enabled" }))
      .execute();
  }

  try {
    // génère un code d'accès valable 3 fois pour l'accès à la mailbox
    const mailboxCode = await createMailboxCode({
      domain_name: DIMAIL_MAILBOX_DOMAIN,
      user_name: userName,
      maxuse: 3,
    });
    const webmailUrl = `${process.env.DIMAIL_WEBMAIL_URL || "https://messagerie.numerique.gouv.fr"}/code/${mailboxCode.code}`;
    // envoi email invitation avec le lien d'accès
    await sendEmail({
      toEmail: [secondaryEmail],
      type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL,
      variables: {
        email: mailboxEmail,
        webmailUrl,
      },
    });
  } catch (e: any) {
    console.error(
      `Error sending DIMAIL access link for ${mailboxEmail}: ${e.status || ""} ${e.message}`,
    );
    Sentry.captureException(e);
    throw e;
  }

  // MAJ infos base espace-membre (primary_email_status)
  // keep primary_email so the user dont change its current login
  // set newly created email otherwise
  const primaryEmail = dbUser.primary_email || mailboxEmail;
  await db
    .updateTable("users")
    .set({
      primary_email: primaryEmail,
      primary_email_status: status,
    })
    .where("uuid", "=", userUuid)
    .execute();

  return mailboxEmail;
}

/*

onboarding d'un nouveau membre : crée la boite puis, seulement une fois la
boite créée, envoie l'invitation à se connecter via ProConnect.

idempotent : en cas de retry pg-boss (ex: échec d'envoi de l'invitation),
la boite n'est pas recréée (sinon 409) et l'invitation n'est envoyée qu'une fois.

*/
export async function onboardNewMemberMailbox(userUuid: string) {
  const dbUser = await getUserBasicInfo({ uuid: userUuid });
  if (!dbUser) {
    throw new Error(`User ${userUuid} not found`);
  }
  const mailboxAlreadyCreated =
    dbUser.primary_email_status ===
      EmailStatusCode.EMAIL_VERIFICATION_WAITING &&
    !!dbUser.primary_email?.endsWith(`@${DIMAIL_MAILBOX_DOMAIN}`);

  if (mailboxAlreadyCreated) {
    console.log(`DIMAIL mailbox already created for ${dbUser.username}`);
  } else if (
    dbUser.primary_email_status === EmailStatusCode.EMAIL_CREATION_WAITING
  ) {
    await createDimailMailboxForUser(userUuid, {
      status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
    });
  } else {
    // user is not onboarding anymore (already verified, suspended...)
    console.log(
      `Skip onboarding of ${dbUser.username}: status is ${dbUser.primary_email_status}`,
    );
    return;
  }

  const invitationEvent = await getLastEvent(
    dbUser.username,
    EventCode.EMAIL_VERIFICATION_WAITING_SENT,
  );
  if (invitationEvent) {
    console.log(`Invitation already sent to ${dbUser.username}`);
    return;
  }
  await sendNewMemberVerificationEmail({ userId: userUuid });
}

export async function createDimailMailbox(
  job: PgBoss.Job<CreateDimailAdressDataSchemaType>,
) {
  console.log(
    `Create DIMAIL mailbox for ${job.data.userUuid}: ${job.data.username}`,
    job.id,
    job.name,
  );
  if (job.data.onboarding) {
    await onboardNewMemberMailbox(job.data.userUuid);
    return;
  }
  const email = await createDimailMailboxForUser(job.data.userUuid);
  console.log(
    `The DIMAIL mailbox has been created for ${job.data.userUuid}: ${email}`,
  );
}
