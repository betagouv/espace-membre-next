// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import { sendLegacyEmailLoginReminders } from "@/lib/auth/legacyEmailLogin";

async function main() {
  await sendLegacyEmailLoginReminders();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
