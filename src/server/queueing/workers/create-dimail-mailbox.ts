import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { CreateDimailAdressDataSchemaType } from "@/models/jobs/services";
import { createMailbox, createAlias } from "@lib/dimail/client";
import {
  getDimailUsernameForUser,
  DIMAIL_MAILBOX_DOMAIN,
} from "@lib/dimail/utils";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import * as Sentry from "@sentry/nextjs";

export const createDimailMailboxTopic = "create-dimail-mailbox";

const splitFullName = (fullname: string) => {
  const [prenom, ...rest] = fullname.trim().split(" ");
  return [prenom, rest.join(" ")];
};

export async function createDimailMailboxForUser(userUuid: string) {
  const dbUser = await getUserBasicInfo({ uuid: userUuid });
  if (!dbUser) {
    throw new Error(`User ${userUuid} not found`);
  }
  if (!dbUser.secondary_email) {
    throw new Error(`User ${userUuid} has no secondary_email`);
  }

  const baseInfoUser = memberBaseInfoToModel(dbUser);

  const userName = getDimailUsernameForUser(
    baseInfoUser.username,
    baseInfoUser.legal_status || "",
  );

  console.log(
    `Create DIMAIL mailbox: ${userName}@${DIMAIL_MAILBOX_DOMAIN} for ${baseInfoUser.fullname}`,
  );

  const [surName, givenName] = splitFullName(baseInfoUser.fullname);

  const mailboxInfos = await createMailbox({
    user_name: userName,
    domain: DIMAIL_MAILBOX_DOMAIN,
    displayName: baseInfoUser.fullname,
    givenName,
    surName,
  })
    .then(async (infos) => {
      // envoi email invitation avec password
      if (baseInfoUser.secondary_email) {
        await sendEmail({
          toEmail: [baseInfoUser.secondary_email],
          type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL,
          variables: {
            email: infos.email,
            password: infos.password,
            webmailUrl:
              process.env.DIMAIL_WEBMAIL_URL || "https://webmail.beta.gouv.fr/",
          },
        });
      } else {
        console.error(
          `No secondary email defined for ${baseInfoUser.username}`,
        );
        Sentry.captureException(
          new Error(`No secondary email defined for ${baseInfoUser.username}`),
        );
      }
      return infos;
    })
    .catch((e) => {
      console.error(
        `Error creating mailbox ${userName}@${DIMAIL_MAILBOX_DOMAIN}: ${e.status || ""} ${e.message}`,
      );
      Sentry.captureException(e);
      if (e.status === 409) {
        // mailbox already exist
        // todo: handle this case, regenerate password ?
        return { email: `${userName}@${DIMAIL_MAILBOX_DOMAIN}` };
      } else {
        throw e;
      }
    });

  // if we create a new address on the same domain, add an alias
  // ex: prenom.nom.ext replacing prenom.nom
  if (
    baseInfoUser.primary_email?.endsWith(`@${DIMAIL_MAILBOX_DOMAIN}`) &&
    baseInfoUser.primary_email !== mailboxInfos.email
  ) {
    const legacyUserName = baseInfoUser.primary_email.split("@")[0];
    console.info(
      `Create DIMAIL alias: ${legacyUserName}@${DIMAIL_MAILBOX_DOMAIN} -> ${mailboxInfos.email}`,
    );
    await createAlias({
      user_name: legacyUserName,
      domain: DIMAIL_MAILBOX_DOMAIN,
      destination: mailboxInfos.email,
    });
  }

  // MAJ infos base espace-membre (primary_email et primary_email_status)
  await db
    .updateTable("users")
    .set({
      primary_email: mailboxInfos.email,
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    })
    .where("uuid", "=", userUuid)
    .execute();

  // MAJ de la table dinum_emails
  // update the dinum_emails in the database with the new email
  await db
    .insertInto("dinum_emails")
    .values({
      email: mailboxInfos.email,
      status: "enabled",
    })
    .onConflict((oc) => oc.column("email").doUpdateSet({ status: "enabled" }))
    .execute();

  return mailboxInfos.email;
}

export async function createDimailMailbox(
  job: PgBoss.Job<CreateDimailAdressDataSchemaType>,
) {
  console.info(
    `Create dimail mailbox for ${job.data.userUuid}: ${job.data.username}`,
    job.id,
    job.name,
  );
  const email = await createDimailMailboxForUser(job.data.userUuid);
  console.info(
    `The dimail mailbox has been created for ${job.data.userUuid}: ${email}`,
  );
}
