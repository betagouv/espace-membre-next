import { syncDinumEmailsJob } from "@/server/queueing/workers/sync-dinum-emails";

const DIMAIL_MAILBOX_DOMAIN = process.env.DIMAIL_MAILBOX_DOMAIN || "some";

async function main() {
  console.log("start job sync dinum_emails tables");
  await syncDinumEmailsJob(DIMAIL_MAILBOX_DOMAIN);
  await syncDinumEmailsJob("ext.beta.gouv.fr"); // legacy, todo remove
  console.log("done sync dinum_emails tables");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
