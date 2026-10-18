// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
import {
  assertLegacyEmailLoginConfig,
  sendLegacyEmailLoginReminders,
} from "@/lib/auth/legacyEmailLogin";

async function main() {
  // the cron app does not go through instrumentation.ts
  assertLegacyEmailLoginConfig();
  await sendLegacyEmailLoginReminders();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
