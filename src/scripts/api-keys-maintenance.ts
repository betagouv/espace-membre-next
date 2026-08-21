import { apiKeysMaintenance } from "@/server/queueing/workers/api-keys-maintenance";

async function main() {
  await apiKeysMaintenance();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
