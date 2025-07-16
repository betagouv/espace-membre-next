import PgBoss from "pg-boss";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent";
import { CreateDimailAdressDataSchemaType } from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { createMailbox } from "@lib/dimail/client";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";
import { memberBaseInfoToModel } from "@/models/mapper";

export const createDimailMailboxTopic = "create-dimail-mailbox";

export async function createDimailMailbox(
  job: PgBoss.Job<CreateDimailAdressDataSchemaType>,
) {
  console.log(
    `Create dimail mailboxe for ${job.data.userUuid}`,
    job.id,
    job.name,
  );
  // get member infos
  
  const dbUser = await getUserBasicInfo({ uuid: job.data.userUuid });
  if (!dbUser) {
    throw new Error(`User ${job.data.userUuid} not found`);
  }
  const baseInfoUser = memberBaseInfoToModel(dbUser);
 
  // determine the domain based on the user's legal status
  const domain = baseInfoUser.legal_status.includes("public") ? "beta.gouv.fr" : "ext.beta.gouv.fr";
  const mailboxInfos = await createMailbox({
    user_name: baseInfoUser.username,
    domain,
  });

  // envoi email invitation avec password
  await sendEmail({
      toEmail: [baseInfoUser.secondary_email],
      type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL,
      variables: {
        email: mailboxInfos.email,
        password: mailboxInfos.password,
        webmailUrl: process.env.DIMAIL_WEBMAIL_URL || "https://webmail.beta.gouv.fr/",
      },
    });
  // MAJ infos base espace-membre (primary_email et primary_email_status)
  await db
    .updateTable("users")
    .set({
      primary_email: mailboxInfos.email,
      primary_email_status: "active",
    })
    .where("uuid", "=", job.data.userUuid)
    .execute();
  // MAJ de la table dinum_emails
  await db
    .insert("dinum_emails")
    .values({
      email: mailboxInfos.email,
      status: "active",
    })
    .where("user_id", "=", job.data.userUuid)
    .execute();
  // envoi email invitation avec password
  // update the dinum_emails in the database with the new email
  // add an event to the events table
  await addEvent({
    userUuid: job.data.userUuid,
    code: EventCode.DIMAIL_EMAIL_CREATED,
    data: {
      email: mailboxInfos.email,
    },
  });
  await db
    .updateTable("service_accounts")
    .set({
      email: mailboxInfos.email,
      service_user_id: job.data.serviceUserId,
      status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
    })
    .where("account_type", "=", SERVICES.DIMAIL)
    .where("user_id", "=", job.data.userUuid)
    .execute();

  console.log(`the dimail email has been created for ${job.data.username}`);
}
