import crypto from "crypto";
import pAll from "p-all";

import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import BetaGouv from "@betagouv";
import { setEmailSuspended } from "@controllers/usersController";
import * as utils from "@controllers/utils";
import { DIMAIL_MAILBOX_DOMAIN } from "@lib/dimail/utils";
import { patchMailbox } from "@lib/dimail/client";

// desactive l'email des comptes expirés depuis + 5 jours
export async function deactivateExpiredMembersEmails() {
  // utilisateurs expirés depuis 5 jours en EMAIL_ACTIVE
  // met un passe aleatoire
  // marque l'email comme suspendu
  // setEmailSuspended(username)
  const users = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );
  const expiredUsers = utils
    .getExpiredUsers(users, 5)
    .filter(
      (user) => user.primary_email_status === EmailStatusCode.EMAIL_ACTIVE,
    );

  return pAll(
    expiredUsers.map((user) => async () => {
      const emailInfos = await BetaGouv.emailInfos(user.username);
      console.log(
        `deactivateExpiredMembersEmails`,
        user.username,
        emailInfos?.emailPlan,
      );
      if (emailInfos?.emailPlan === EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI) {
        try {
          await patchMailbox({
            domain_name: DIMAIL_MAILBOX_DOMAIN,
            user_name: emailInfos.email.split("@")[0],
            data: {
              active: "no",
            },
          });
          await setEmailSuspended(user.username);
          console.log(
            `Le compte DIMAIL de ${
              user.username
            } a été désactivé car sa mission a expiré.`,
          );
        } catch (e: any) {
          console.error(
            `Imposssible de désactiver le compte DIMAIL de ${emailInfos.email}: ${e.message}`,
          );
          console.error(e);
        }
      } else {
        // change OVH password
        // todo: remove
        const newPassword = crypto
          .randomBytes(16)
          .toString("base64")
          .slice(0, -2);
        try {
          await BetaGouv.changePassword(
            user.username,
            newPassword,
            emailInfos?.emailPlan,
          );
          await setEmailSuspended(user.username);
          console.log(
            `Le mot de passe email OVH de ${
              user.username
            } a été modifié car sa mission a expiré`,
          );
        } catch (err) {
          console.error(
            `Le mode de passe email OVH de ${user.username} n'a pas pu être modifié: ${err}`,
          );
        }
      }
    }),
    { concurrency: 1 },
  );
}
