import { db } from "@/lib/kysely";
import { Domaine } from "@/models/member";
import Betagouv from "@betagouv";
import { buildBetaEmail } from "@controllers/utils";

const createMissingActiveUserInDb = async () => {
  const activeUsers = await Betagouv.getActiveRegisteredOVHUsers();
  for (const user of activeUsers) {
    try {
      const users = await db
        .selectFrom("users")
        .where("username", "=", user.username)
        .execute();
      if (!users) {
        console.log(`User ${user.username} is active but not in bdd`);
        await db
          .insertInto("users")
          .values({
            username: user.username,
            fullname: user.username,
            primary_email: buildBetaEmail(user.username),
            role: "",
            domaine: Domaine.ANIMATION,
          })
          .execute();
      }
    } catch (e) {
      // error
    }
  }
};

createMissingActiveUserInDb();
