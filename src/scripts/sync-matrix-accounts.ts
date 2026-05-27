import { syncMatrixAccounts } from "@/server/queueing/workers/sync-matrix-accounts";

async function main() {
  await syncMatrixAccounts({ id: "manual", name: "sync-matrix-accounts", data: null } as any);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
