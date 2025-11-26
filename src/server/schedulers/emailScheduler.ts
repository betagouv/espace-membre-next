import crypto from "crypto";
import _ from "lodash/array";
import pAll from "p-all";

import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode, memberBaseInfoSchemaType } from "@/models/member";
import { EMAIL_PLAN_TYPE, OvhRedirection } from "@/models/ovh";
import BetaGouv from "@betagouv";
import { setEmailSuspended } from "@controllers/usersController";
import * as utils from "@controllers/utils";
import { isBetaEmail } from "@controllers/utils";
import { DIMAIL_MAILBOX_DOMAIN } from "@lib/dimail/utils";
import { patchMailbox } from "@lib/dimail/client";

const differenceGithubRedirectionOVH = function differenceGithubOVH(
  user: memberBaseInfoSchemaType,
  ovhAccountName: string,
) {
  return utils.buildBetaRedirectionEmail(user.username) === ovhAccountName;
};

// desactive l'email des comptes expirés depuis + 5 jours
export async function reinitPasswordEmail() {
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
        } catch (e: any) {
          console.error(
            `Cannot reinit DIMAIL password for ${emailInfos.email}: ${e.message}`,
          );
        }
        console.log(
          `Le mot de passe DIMAIL de ${
            user.username
          } a été modifié car son contrat finissait le ${new Date()}.`,
        );
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
            `Le mot de passe de ${
              user.username
            } a été modifié car son contrat finissait le ${new Date()}.`,
          );
        } catch (err) {
          console.error(
            `Le mode de passe de ${user.username} n'a pas pu être modifié: ${err}`,
          );
        }
      }
    }),
    { concurrency: 1 },
  );
}
