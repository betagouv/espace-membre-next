import crypto from "crypto";
import _ from "lodash/array";
import pAll from "p-all";

import { db } from "@/lib/kysely";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import {
  CommunicationEmailCode,
  EmailStatusCode,
  MemberType,
  memberBaseInfoSchemaType,
} from "@/models/member";
import { EMAIL_PLAN_TYPE, OvhRedirection } from "@/models/ovh";
import config from "@/server/config";
import {
  addContactsToMailingLists,
  smtpBlockedContactsEmailDelete,
} from "@/server/config/email.config";
import BetaGouv from "@betagouv";
import {
  setEmailRedirectionActive,
  setEmailSuspended,
} from "@controllers/usersController";
import * as utils from "@controllers/utils";
import { isBetaEmail } from "@controllers/utils";
import { EMAIL_TYPES, MAILING_LIST_TYPE } from "@modules/email";
import { DIMAIL_MAILBOX_DOMAIN } from "@lib/dimail/utils";
import { patchMailbox } from "@lib/dimail/client";

const differenceGithubRedirectionOVH = function differenceGithubOVH(
  user: memberBaseInfoSchemaType,
  ovhAccountName: string,
) {
  return utils.buildBetaRedirectionEmail(user.username) === ovhAccountName;
};

const getValidUsers = async () => {
  const githubUsers = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );
  return githubUsers.filter((x) => !utils.checkUserIsExpired(x));
};

// todo: remove
export async function setCreatedEmailRedirectionsActive() {
  const fiveMinutesInMs: number = 5 * 1000 * 60;
  const nowLessFiveMinutes: Date = new Date(Date.now() - fiveMinutesInMs);
  const dbUsers = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );
  const concernedUsers = dbUsers.filter(
    (user) =>
      !utils.checkUserIsExpired(user) &&
      user.primary_email_status === EmailStatusCode.EMAIL_REDIRECTION_PENDING &&
      user.primary_email_status_updated_at < nowLessFiveMinutes &&
      user.email_is_redirection === true,
  );

  return Promise.all(
    concernedUsers.map(async (user) => {
      if (user.memberType === MemberType.ATTRIBUTAIRE) {
        const listTypes = [MAILING_LIST_TYPE.NEWSLETTER];
        if (
          user.primary_email_status ===
          EmailStatusCode.EMAIL_REDIRECTION_PENDING
        ) {
          listTypes.push(MAILING_LIST_TYPE.ONBOARDING);
        }
        await addContactsToMailingLists({
          listTypes: listTypes,
          contacts: [
            {
              email: (user.communication_email ===
                CommunicationEmailCode.SECONDARY && user.secondary_email
                ? user.secondary_email
                : user.primary_email) as string,
              firstname: utils.capitalizeWords(user.username.split(".")[0]),
              lastname: utils.capitalizeWords(user.username.split(".")[1]),
              domaine: user.domaine,
            },
          ],
        });
      }
      await smtpBlockedContactsEmailDelete({
        email: user.primary_email as string,
      });
      await setEmailRedirectionActive(user.username);
    }),
  );
}

// todo: remove
export async function createRedirectionEmailAdresses() {
  const dbUsers = (await getAllUsersInfo()).map((user) =>
    memberBaseInfoToModel(user),
  );
  const concernedUsers = dbUsers.filter(
    (user) =>
      !user.primary_email &&
      user.primary_email_status === EmailStatusCode.EMAIL_CREATION_WAITING &&
      user.email_is_redirection &&
      user.secondary_email,
  );

  const redirections: OvhRedirection[] = await BetaGouv.redirections();

  const allOvhRedirectionEmails = Array.from(
    new Set([
      ...(redirections.reduce(
        (acc: string[], r) => (!isBetaEmail(r.to) ? [...acc, r.from] : acc),
        [],
      ) as []),
    ]),
  ).sort();
  let unregisteredMembers = _.differenceWith(
    concernedUsers,
    allOvhRedirectionEmails,
    differenceGithubRedirectionOVH,
  );
  console.log(
    `Email creation : ${unregisteredMembers.length} unregistered user(s) in OVH (${allOvhRedirectionEmails.length} accounts in OVH. ${concernedUsers.length} accounts in Github).`,
  );
  unregisteredMembers = unregisteredMembers.map((member) => {
    const dbUser = dbUsers.find(
      (dbUser) => dbUser.username === member.username,
    );

    // if (dbUser) {
    //     member.email = dbUser.secondary_email;
    // }
    return member;
  });
  console.log(
    "User that should have redirection",
    unregisteredMembers.map((u) => u.username),
  );
  // create email
  return Promise.all(
    unregisteredMembers.map(async (member) => {
      if (
        process.env.FEATURE_APPLY_CREATE_REDIRECTION_EMAIL ||
        process.env.NODE_ENV === "test"
      ) {
        const email = utils.buildBetaRedirectionEmail(member.username, "attr");
        await BetaGouv.createRedirection(email, member.secondary_email, false);
        const user = await db
          .updateTable("users")
          .where("username", "=", member.username)
          .set({
            primary_email: email,
            primary_email_status: EmailStatusCode.EMAIL_REDIRECTION_PENDING,
            primary_email_status_updated_at: new Date(),
          })
          .returningAll()
          .executeTakeFirst();
        if (user) {
          console.log(`Email redirection créée pour ${user.username}`);
        }
      }
    }),
  );
}

// change le password email des comptes expirés depuis + 5 jours
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

// inscrit les utilisateurs à la mailing-list OVH principale
export async function subscribeEmailAddresses() {
  const activeUsers = await getValidUsers();
  const concernedUsers = activeUsers.filter((u) => u.primary_email);
  const allIncubateurSubscribers = await BetaGouv.getMailingListSubscribers(
    config.incubateurMailingListName,
  );
  const missingOvhUsers = concernedUsers.filter(
    (concernedUser) =>
      !allIncubateurSubscribers.find(
        (email) =>
          email.toLowerCase() === concernedUser?.primary_email?.toLowerCase(),
      ),
  );
  //TODO: EXTRACT members from mailing list
  const missingBrevoMembers = [];
  console.log(
    `Email subscription : ${missingOvhUsers.length} missing user(s) in incubateur OVH mailing list.`,
  );

  // subscribe missings users to mailing list OVH
  // TODO: USE DINUM mailing list
  await pAll(
    missingOvhUsers.map((user) => () => {
      console.log(
        `Subscribe ${user.primary_email} to mailing list incubateur OVH`,
      );
      return BetaGouv.subscribeToMailingList(
        config.incubateurMailingListName,
        user.primary_email as string,
      );
    }),
    { concurrency: 1 },
  );

  // TODO: brevo mailing lists
  //  const listTypes = [MAILING_LIST_TYPE.NEWSLETTER];
  //       if (
  //         user.primary_email_status === EmailStatusCode.EMAIL_CREATION_PENDING
  //       ) {
  //         listTypes.push(MAILING_LIST_TYPE.ONBOARDING);
  //       }
  //       await addContactsToMailingLists({
  //         listTypes: listTypes,
  //         contacts: [
  //           {
  //             email: (user.communication_email ===
  //               CommunicationEmailCode.SECONDARY && user.secondary_email
  //               ? user.secondary_email
  //               : user.primary_email) as string,
  //             firstname: utils.capitalizeWords(user?.username?.split(".")[0]),
  //             lastname: utils.capitalizeWords(user.username.split(".")[1]),
  //             domaine: user.domaine,
  //           },
  //         ],
  //       });
  //       await smtpBlockedContactsEmailDelete({
  //         email: user.primary_email as string,
  //       });
}

// supprime les utilisaterus expirés de la mailing liste principale
export async function unsubscribeEmailAddresses() {
  const concernedUsers = (await getAllUsersInfo())
    .map((user) => memberBaseInfoToModel(user))
    .filter((x) => utils.checkUserIsExpired(x) && x.primary_email);

  const allIncubateurSubscribers: string[] =
    await BetaGouv.getMailingListSubscribers(config.incubateurMailingListName);
  const emails = allIncubateurSubscribers.filter((email) => {
    return concernedUsers.find(
      (concernedUser) =>
        email.toLowerCase() === concernedUser?.primary_email?.toLowerCase(),
    );
  });

  console.log(
    `Email unsubscription : ${emails.length} subscribed user(s) in incubateur mailing list.`,
  );

  // create email
  return Promise.all(
    emails.map(async (email) => {
      await BetaGouv.unsubscribeFromMailingList(
        config.incubateurMailingListName,
        email,
      );
      console.log(`Unsubscribe ${email} from mailing list incubateur`);
    }),
  );
}
