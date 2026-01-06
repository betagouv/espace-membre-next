import crypto from "crypto";
import pAll from "p-all";

import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import BetaGouv from "@betagouv";
import * as utils from "@controllers/utils";
import { DIMAIL_MAILBOX_DOMAIN } from "@lib/dimail/utils";
import { patchMailbox } from "@lib/dimail/client";
import { db } from "@/lib/kysely";
import config from "../config";
import { match, P } from "ts-pattern";

async function setEmailSuspended(username) {
  const user = await db
    .updateTable("users")
    .where("username", "=", username)
    .set({
      primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
      primary_email_status_updated_at: new Date(),
    })
    .execute();
  console.log(`Email suspendu pour ${username}`);
}

// desactive l'email des comptes expirés depuis + 5 jours en EMAIL_ACTIVE
export async function deactivateExpiredMembersEmails() {
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
      if (!emailInfos) {
        await setEmailSuspended(user.username);
        return;
      }
      return match(emailInfos?.emailPlan)
        .with(EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI, async () => {
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
              `Impossible de désactiver le compte DIMAIL de ${emailInfos.email}: ${e.message}`,
            );
            //console.error(e);
          }
        })
        .with(
          P.union(
            EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC,
            EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO,
          ),
          async () => {
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
          },
        )
        .otherwise(() => setEmailSuspended(user.username));
    }),
    { concurrency: 1 },
  );
}
