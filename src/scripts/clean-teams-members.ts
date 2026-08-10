import { cleanTeamsMembers } from "@/server/queueing/workers/clean-teams-members";

async function main() {
  await cleanTeamsMembers();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
