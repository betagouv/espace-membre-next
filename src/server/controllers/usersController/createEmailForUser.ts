import crypto from "crypto";
import _ from "lodash";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getAllStartups } from "@/lib/kysely/queries";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { EmailStatusCode } from "@/models/member";
import {
  EMAIL_PLAN_TYPE,
  OvhExchangeCreationData,
  OvhProCreationData,
} from "@/models/ovh";
import config from "@/server/config";
import BetaGouv from "@betagouv";
import * as utils from "@controllers/utils";

const INCUBATORS_USING_EXCHANGE = ["gip-inclusion"];

async function getEmailCreationParams(username: string): Promise<
  | {
      planType: EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE;
      creationData: OvhExchangeCreationData;
    }
  | { planType: EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC; password: string }
  | {
      planType: EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO;
      creationData: OvhProCreationData;
    }
> {
  const [userInfo, startupsInfos] = await Promise.all([
    getUserInfos({ username }),
    getAllStartups(),
  ]);

  if (!userInfo?.missions) {
    throw new Error(`User ${userInfo?.username} has no mission`);
  }

  const latestMission = userInfo.missions.reduce((a, v) =>
    //@ts-ignore
    !v.end || v.end > a.end ? v : a,
  );
  // todo see what to do with startups
  let needsExchange = false;
  for (const startupUuid of latestMission?.startups || []) {
    const startup = _.find(startupsInfos, { uuid: startupUuid });
    const incubator = startup?.incubator_id;
    if (incubator) {
      const incubatorInfo = await db
        .selectFrom("incubators")
        .select("ghid")
        .where("uuid", "=", incubator)
        .executeTakeFirst();
      if (
        incubatorInfo &&
        _.includes(INCUBATORS_USING_EXCHANGE, incubatorInfo.ghid)
      ) {
        needsExchange = true;
      }
    }
  }

  if (needsExchange) {
    const displayName = userInfo?.fullname ?? "";
    const [firstName, ...lastNames] = displayName.split(" ");
    const lastName = lastNames.join(" ");

    return {
      planType: EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE,
      creationData: {
        displayName,
        firstName,
        lastName,
      },
    };
  } else if (config.EMAIL_DEFAULT_PLAN === EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC) {
    const password = crypto.randomBytes(16).toString("base64").slice(0, -2);

    return {
      planType: EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC,
      password,
    };
  } else {
    const displayName = userInfo?.fullname ?? "";
    const [firstName, ...lastNames] = displayName.split(" ");
    const lastName = lastNames.join(" ");

    return {
      planType: EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO,
      creationData: {
        displayName,
        firstName,
        lastName,
      },
    };
  }
}

export async function createEmail(
  username: string,
  creator: string,
  emailIsRecreated: boolean = false,
) {
  const email = utils.buildBetaEmail(username);

  const secretariatUrl = `${config.protocol}://${config.host}`;

  const emailCreationParams = await getEmailCreationParams(username);

  switch (emailCreationParams.planType) {
    case EMAIL_PLAN_TYPE.EMAIL_PLAN_EXCHANGE:
      await BetaGouv.createEmailForExchange(
        username,
        emailCreationParams.creationData,
      );
      break;
    case EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC:
      await BetaGouv.createEmail(username, emailCreationParams.password);
      break;
    case EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO:
      await BetaGouv.createEmailPro(username, emailCreationParams.creationData);
      break;
  }

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
