import { recreateEmailIfUserActive } from "@/server/schedulers/recreateEmailIfUserActive";

async function main() {
  await recreateEmailIfUserActive();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
