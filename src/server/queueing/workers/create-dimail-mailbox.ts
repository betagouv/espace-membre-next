import PgBoss from "pg-boss";
import * as Sentry from "@sentry/nextjs";

import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { CreateDimailAdressDataSchemaType } from "@/models/jobs/services";
import { EmailStatusCode } from "@/models/member";
import {
  createMailbox,
  createAlias,
  createMailboxCode,
} from "@lib/dimail/client";
import {
  getDimailUsernameForUser,
  DIMAIL_MAILBOX_DOMAIN,
} from "@lib/dimail/utils";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";

export const createDimailMailboxTopic = "create-dimail-mailbox";

const splitFullName = (fullname: string) => {
  const [surName, ...rest] = fullname.trim().split(" ");
  return [surName, rest.join(" ")];
};

/*

créé un email dimail pour un utilisateur

 - crée l'email en prenom.nom[.ext]@domain selon le statut légal de l'utilisateur
 - envoie l'email de connexion à l'utilisateur
 - créé un alias pour les anciens utilisateurs
 - met à jour la table dinum_emails
 - met à jour le primary_email_status en ACTIVE

*/
export async function createDimailMailboxForUser(userUuid: string) {
  const dbUser = await getUserBasicInfo({ uuid: userUuid });
  if (!dbUser) {
    throw new Error(`User ${userUuid} not found`);
  }
  if (!dbUser.secondary_email) {
    throw new Error(`User ${userUuid} has no secondary_email`);
  }

  const userName = getDimailUsernameForUser(
    dbUser.username,
    dbUser.legal_status || "",
  );

  console.log(
    `Create DIMAIL mailbox: ${userName}@${DIMAIL_MAILBOX_DOMAIN} for ${dbUser.fullname}`,
  );

  const [surName, givenName] = splitFullName(dbUser.fullname);

  const secondaryEmail = dbUser.secondary_email;

  if (!secondaryEmail) {
    console.error(`No secondary email defined for ${dbUser.username}`);
    Sentry.captureException(
      new Error(`No secondary email defined for ${dbUser.username}`),
    );
    throw new Error(`No secondary email defined for ${dbUser.username}`);
  }

  const mailboxInfos = await createMailbox({
    user_name: userName,
    domain: DIMAIL_MAILBOX_DOMAIN,
    displayName: dbUser.fullname,
    givenName,
    surName,
  })
    .then(async (infos) => {
      // génère un code d'accès valable 3 fois pour l'accès à la mailbox
      const mailboxCode = await createMailboxCode({
        domain_name: DIMAIL_MAILBOX_DOMAIN,
        user_name: userName,
        maxuse: 3,
      });
      const webmailUrl = `${process.env.DIMAIL_WEBMAIL_URL || "https://messagerie.numerique.gouv.fr"}/code/${mailboxCode.code}`;
      // envoi email invitation avec password
      await sendEmail({
        toEmail: [secondaryEmail],
        type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL,
        variables: {
          email: infos.email,
          webmailUrl,
        },
      });
      return infos;
    })
    .catch((e) => {
      console.error(
        `Error creating DIMAIL mailbox ${userName}@${DIMAIL_MAILBOX_DOMAIN}: ${e.status || ""} ${e.message}`,
      );
      Sentry.captureException(e);
      if (e.status === 409) {
        // mailbox already exist somewhere
        console.log(
          `Error 409 creating dimail for ${userName}@${DIMAIL_MAILBOX_DOMAIN}`,
        );
        throw e;
        //return { email: `${userName}@${DIMAIL_MAILBOX_DOMAIN}` };
      }
      throw e;
    });

  // MAJ infos base espace-membre (primary_email_status)
  // keep primary_email so the user dont change its current login
  // set newly created email otherwise
  const primaryEmail = dbUser.primary_email || mailboxInfos.email;
  await db
    .updateTable("users")
    .set({
      primary_email: primaryEmail,
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    })
    .where("uuid", "=", userUuid)
    .execute();

  // MAJ de la table dinum_emails
  // update the dinum_emails in the database with the original or new email to mark migrated
  await db
    .insertInto("dinum_emails")
    .values({
      email: mailboxInfos.email,
      type: "mailbox",
      status: "ok",
      user_id: userUuid,
    })
    .onConflict((oc) => oc.column("email").doUpdateSet({ status: "enabled" }))
    .execute();

  // if we create a new address, add an alias
  // ex: prenom.nom -> prenom.nom.ext
  // only create the alias for legacy members, up to 01/12/2025
  if (
    dbUser.primary_email &&
    dbUser.primary_email.endsWith(`@${DIMAIL_MAILBOX_DOMAIN}`) &&
    dbUser.primary_email !== mailboxInfos.email
  ) {
    // créé un alias prenom.nom@beta.gouv.fr pour les comptes créés avant le 1er Décembre 2025
    if (new Date(dbUser.created_at) >= new Date(2025, 11, 1)) {
      console.info(
        `Skip create DIMAIL alias for ${mailboxInfos.email} : not a legacy member`,
      );
    } else {
      const legacyUserName = dbUser.primary_email.split("@")[0];
      const legacyEmail = `${legacyUserName}@${DIMAIL_MAILBOX_DOMAIN}`;
      console.info(
        `Create DIMAIL alias: ${legacyEmail} -> ${mailboxInfos.email}`,
      );
      try {
        await createAlias({
          user_name: legacyUserName,
          domain: DIMAIL_MAILBOX_DOMAIN,
          destination: mailboxInfos.email,
        });
        // MAJ de la table dinum_emails
        // update the dinum_emails in the database with the new email
        await db
          .insertInto("dinum_emails")
          .values({
            email: legacyEmail,
            type: "alias",
            destination: mailboxInfos.email,
            status: "enabled",
            user_id: userUuid,
          })
          .onConflict((oc) =>
            oc.column("email").doUpdateSet({ status: "enabled" }),
          )
          .execute();
      } catch (e: any) {
        console.error(
          `Error creating DIMAIL alias ${legacyUserName}@${DIMAIL_MAILBOX_DOMAIN} -> ${mailboxInfos.email} : ${e.message}`,
        );
        Sentry.captureException(
          new Error(
            `Error creating DIMAIL alias ${legacyUserName}@${DIMAIL_MAILBOX_DOMAIN} -> ${mailboxInfos.email} : ${e.message}`,
          ),
        );
      }
    }
  }

  return mailboxInfos.email;
}

export async function createDimailMailbox(
  job: PgBoss.Job<CreateDimailAdressDataSchemaType>,
) {
  console.info(
    `Create DIMAIL mailbox for ${job.data.userUuid}: ${job.data.username}`,
    job.id,
    job.name,
  );
  const email = await createDimailMailboxForUser(job.data.userUuid);
  console.info(
    `The DIMAIL mailbox has been created for ${job.data.userUuid}: ${email}`,
  );
}
