// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
// read only : counts the active members not migrated to ProConnect + MFA, by
// what they need to migrate. --list prints the usernames of the at-risk ones.
import { reportLegacyEmailLoginPopulation } from "@/lib/auth/legacyEmailLogin/population";

const AT_RISK = ["ext_without_alias", "no_primary_email", "other"];

async function main() {
  const { total, byCategory } = await reportLegacyEmailLoginPopulation();
  console.log(`${total} active members not migrated`);
  for (const [category, usernames] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${usernames.length}`);
  }
  if (process.argv.includes("--list")) {
    for (const category of AT_RISK) {
      console.log(`\n${category}:`);
      for (const username of byCategory[category] || []) {
        console.log(`  ${username}`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
