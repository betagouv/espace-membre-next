import PgBoss from "pg-boss";

import { db } from "@/lib/kysely";
import { CreateDimailAdressDataSchemaType } from "@/models/jobs/services";
import { createMailbox } from "@lib/dimail/client";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { sendEmail } from "@/server/config/email.config";
import { EMAIL_TYPES } from "@/server/modules/email";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";

export const createDimailMailboxTopic = "create-dimail-mailbox";
const DIMAIL_MAILBOX_DOMAIN =
  process.env.DIMAIL_MAILBOX_DOMAIN || "beta.gouv.fr";

export async function createDimailMailbox(
  job: PgBoss.Job<CreateDimailAdressDataSchemaType>,
) {
  console.log(
    `Create dimail mailbox for ${job.data.userUuid}`,
    job.id,
    job.name,
  );
  // get member infos

  const dbUser = await getUserBasicInfo({ uuid: job.data.userUuid });
  if (!dbUser) {
    throw new Error(`User ${job.data.userUuid} not found`);
  }
  const baseInfoUser = memberBaseInfoToModel(dbUser);

  const username = ["contractuel", "fonctionnaire"].includes(
    (baseInfoUser as any).legal_status || "",
  )
    ? baseInfoUser.username
    : `${baseInfoUser.username}.ext`;

  const mailboxInfos = await createMailbox({
    user_name: baseInfoUser.username,
    domain: DIMAIL_MAILBOX_DOMAIN,
  });
  // todo: if the domain is ext.beta.gouv.fr, create an alias on beta.gouv.fr domain

  // envoi email invitation avec password
  await sendEmail({
    toEmail: [baseInfoUser.secondary_email],
    type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL,
    variables: {
      email: mailboxInfos.email,
      password: mailboxInfos.password,
      webmailUrl:
        process.env.DIMAIL_WEBMAIL_URL || "https://webmail.beta.gouv.fr/",
    },
  });

  // MAJ infos base espace-membre (primary_email et primary_email_status)
  await db
    .updateTable("users")
    .set({
      primary_email: mailboxInfos.email,
      primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
    })
    .where("uuid", "=", job.data.userUuid)
    .execute();

  // MAJ de la table dinum_emails
  // update the dinum_emails in the database with the new email
  await db
    .insertInto("dinum_emails")
    .values({
      email: mailboxInfos.email,
      status: EmailStatusCode.EMAIL_ACTIVE,
    })
    .execute();

  console.log(`the dimail mailbox has been created for ${job.data.userUuid}`);
}
