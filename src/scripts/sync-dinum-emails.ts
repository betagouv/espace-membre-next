import { startSync } from "@/server/queueing/workers/sync-dinum-emails";

async function main() {
  console.log("start job sync dinum_emails tables");
  await startSync();
  console.log("done sync dinum_emails tables");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
