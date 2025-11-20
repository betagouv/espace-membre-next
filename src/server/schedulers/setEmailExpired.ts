import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode, memberBaseInfoSchemaType } from "@/models/member";
import config from "@/server/config";
import * as utils from "@controllers/utils";

// pour les users données
// OU
// les users non @beta.gouv.fr en EMAIL_SUSPENDED et dont l'email a été mis à jour il y a plus de 30J
// met l'email en EMAIL_EXPIRED
export async function setEmailExpired(
  optionalExpiredUsers?: memberBaseInfoSchemaType[],
) {
  // set email that are not beta.gouv.fr as expired
  let expiredUsers = optionalExpiredUsers;
  let dbUsers: memberBaseInfoSchemaType[] = [];
  if (!expiredUsers) {
    const users = (await getAllUsersInfo()).map((user) =>
      memberBaseInfoToModel(user),
    );
    expiredUsers = users.filter((user) => {
      return utils.checkUserIsExpired(user, 30);
    });
    const today = new Date();
    const todayLess30days = new Date();
    todayLess30days.setDate(today.getDate() - 30);
    dbUsers = users.filter(
      (user) =>
        user.primary_email_status === EmailStatusCode.EMAIL_SUSPENDED &&
        user.primary_email_status_updated_at < todayLess30days &&
        user.primary_email &&
        !user.primary_email.includes(`@${config.domain}`),
    );
  }
  for (const user of dbUsers) {
    try {
      await db
        .updateTable("users")
        .where("username", "=", user.username)
        .set({
          primary_email_status: EmailStatusCode.EMAIL_EXPIRED,
        })
        .execute();
      await addEvent({
        action_code: EventCode.MEMBER_EMAIL_EXPIRED,
        created_by_username: SYSTEM_NAME,
        action_on_username: user.username,
      });
      console.log(`Email principal pour ${user.username} défini comme expiré`);
    } catch {
      console.log(
        `Erreur lors du changement de statut en expiré de l'email principal pour ${user.username}`,
      );
    }
  }
}
