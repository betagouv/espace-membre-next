import _ from "lodash";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { userInfosToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import config from "@/server/config";
import BetaGouv from "@betagouv";
import * as utils from "@controllers/utils";
import { createMailbox, DimailEmailParams } from "@/lib/dimail/client";

export async function createEmailForUser(
  { username }: { username: string },
  currentUser: string,
) {
  const isCurrentUser = currentUser === username;
  const [user] = await Promise.all([
    utils.userInfos({ username }, isCurrentUser),
  ]);
  if (!user.userInfos) {
    throw new Error(
      `Le membre ${username} n'a pas de fiche sur l'espace-membre: vous ne pouvez pas créer son compte email.`,
    );
  }

  if (user.isExpired) {
    throw new Error(`Le compte du membre ${username} est expiré.`);
  }

  if (!user.authorizations.canCreateEmail) {
    throw new Error(
      "Vous n'avez pas le droit de créer le compte email du membre.",
    );
  }

  if (!isCurrentUser) {
    const loggedUserInfo = userInfosToModel(
      await getUserInfos({ username: currentUser }),
    );
    if (!loggedUserInfo) {
      throw new Error(
        "Vous ne pouvez pas créer de compte email car votre compte  n'a pas de fiche dans l'espace-membre.",
      );
    } else if (utils.checkUserIsExpired(loggedUserInfo)) {
      throw new Error(
        "Vous ne pouvez pas créer le compte email car votre compte a une date de fin expiré.",
      );
    }
  }
  // todo
  let emailIsRecreated = false;
  if (user) {
    if (user.userInfos.email_is_redirection) {
      throw new Error(
        `Le membre ${username} ne peut pas avoir d'email beta.gouv.fr, iel utilise une adresse de redirection.`,
      );
    }
    emailIsRecreated =
      user.userInfos.primary_email_status === EmailStatusCode.EMAIL_DELETED;
    await createEmail(username, currentUser, emailIsRecreated);
  }
}

async function getEmailCreationParams(username: string): Promise<{
  planType: EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI;
  creationData: DimailEmailParams;
}> {
  const userInfo = await getUserInfos({ username });

  if (!userInfo?.missions) {
    throw new Error(`User ${userInfo?.username} has no mission`);
  }

  return {
    planType: EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI,
    creationData: {
      domain: process.env.DIMAIL_MAILBOX_DOMAIN || "beta.gouv.fr",
      user_name: userInfo.username,
      displayName: userInfo.fullname,
    },
  };
}

export async function createEmail(
  username: string,
  creator: string,
  emailIsRecreated: boolean = false,
) {
  const email = utils.buildBetaEmail(username);

  const secretariatUrl = `${config.protocol}://${config.host}`;

  const emailCreationParams = await getEmailCreationParams(username);

  await createMailbox(emailCreationParams.creationData);

  await db
    .updateTable("users")
    .where("username", "=", username)
    .set({
      primary_email: email,
      primary_email_status: emailIsRecreated
        ? EmailStatusCode.EMAIL_RECREATION_PENDING
        : EmailStatusCode.EMAIL_CREATION_PENDING,
      primary_email_status_updated_at: new Date(),
    })
    .execute();

  addEvent({
    action_code: emailIsRecreated
      ? EventCode.MEMBER_EMAIL_RECREATED
      : EventCode.MEMBER_EMAIL_CREATED,
    created_by_username: creator,
    action_on_username: username,
    action_metadata: {
      value: email,
    },
  });
  const message = `À la demande de ${creator} sur <${secretariatUrl}>, je lance la création d'un compte mail pour ${username}`;

  await BetaGouv.sendInfoToChat(message);
  console.log(`Création de compte by=${creator}&email=${email}`);
}

export async function updateSecondaryEmail(username, secondary_email) {
  return db
    .updateTable("users")
    .where("username", "=", username)
    .set({
      secondary_email,
    })
    .execute();
}
