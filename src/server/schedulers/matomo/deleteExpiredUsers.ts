// Import the library
import { MatomoClient } from "@/lib/matomo"; // or relative path if not published
import config from "@/server/config";

// Create a new MatomoClient instance
if (!config.MATOMO_API_URL) {
    console.error("Missing MATOMO_API_URL");
    process.exit(1);
}
if (!config.MATOMO_TOKEN) {
    console.error("Missing MATOMO_TOKEN");
    process.exit(1);
}
const matomo = new MatomoClient(config.MATOMO_API_URL, config.MATOMO_TOKEN);

// Delete a user by email
export async function deleteUser(email: string) {
    await matomo.deleteUserByEmail(email);
}
