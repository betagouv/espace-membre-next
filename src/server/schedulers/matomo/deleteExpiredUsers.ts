// Import the library
import { MatomoClient } from "@/lib/matomo"; // or relative path if not published
import config from "@/server/config";

// Create a new MatomoClient instance
const matomo = new MatomoClient(config.MATOMO_URL, config.MATOMO_TOKEN);

// Fetch a user by email
async function fetchUserByEmail(email: string) {
    const user = await matomo.getUserByEmail(email);
    console.log(user);
}

// Delete a user by email
async function deleteUser(email: string) {
    await matomo.deleteUserByEmail(email);
}
