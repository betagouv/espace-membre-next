import { syncDinumEmailsJob } from "@/server/queueing/workers/sync-dinum-emails";

const DIMAIL_MAILBOX_DOMAIN = process.env.DIMAIL_MAILBOX_DOMAIN || "some";

async function main() {
  console.info("start job sync dinum_emails table");
  await syncDinumEmailsJob(DIMAIL_MAILBOX_DOMAIN);
  await syncDinumEmailsJob("ext.beta.gouv.fr"); // legacy, todo remove
  console.info("done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
