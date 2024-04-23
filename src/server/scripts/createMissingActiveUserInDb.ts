import { Member } from "@/models/member";
import Betagouv from "@betagouv";
import { buildBetaEmail } from "@controllers/utils";
import knex from "@db";

const createMissingActiveUserInDb = async () => {
    const activeUsers = await Betagouv.getActiveRegisteredOVHUsers();
    for (const user of activeUsers) {
        try {
            const users = await knex("users")
                .where({ username: user.username })
                .first();
            if (!users) {
                console.log(`User ${user.username} is active but not in bdd`);
                await knex("users").insert({
                    username: user.username,
                    primary_email: buildBetaEmail(user.username),
                });
            }
        } catch (e) {
            // error
        }
    }
};

createMissingActiveUserInDb();
