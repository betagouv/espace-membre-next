import axios from "axios";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { compareAsc, startOfDay } from "date-fns";
import _ from "lodash";
import nodemailer from "nodemailer";

import { getUserInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import {
  EMAIL_PLAN_TYPE,
  Redirection,
  memberBaseInfoSchemaType,
  memberSchemaType,
  memberWrapperSchemaType,
} from "@/models/member";
import config from "@/lib/config";
import { getDimailEmailsByUser } from "@/lib/kysely/queries/dimail";

export function encryptPassword(password) {
  const iv = randomBytes(16);

  const cipher = createCipheriv(
    "aes-256-cbc",
    new Uint8Array(Buffer.from(config.PASSWORD_ENCRYPT_KEY!, "hex")),
    new Uint8Array(iv),
  );
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptPassword(encryptedPassword) {
  const key = Buffer.from(config.PASSWORD_ENCRYPT_KEY!, "hex");
  const [ivHex, encrypted] = encryptedPassword.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = createDecipheriv(
    "aes-256-cbc",
    new Uint8Array(key),
    new Uint8Array(iv),
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const mailTransport = nodemailer.createTransport({
  debug: process.env.MAIL_DEBUG === "true",
  service: process.env.MAIL_SERVICE ? process.env.MAIL_SERVICE : null,
  host: process.env.MAIL_SERVICE ? null : process.env.MAIL_HOST,
  port: process.env.MAIL_SERVICE
    ? null
    : parseInt(process.env.MAIL_PORT || "25", 10),
  ignoreTLS: process.env.MAIL_SERVICE
    ? null
    : process.env.MAIL_IGNORE_TLS === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendMail(
  toEmail,
  subject,
  html,
  extraParams = {},
  attachments = [],
) {
  const mail = {
    to: toEmail,
    from: `Espace Membre BetaGouv <${config.senderEmail}>`,
    subject,
    html,
    text: html.replace(/<(?:.|\n)*?>/gm, ""),
    attachments,
    headers: { "X-Mailjet-TrackOpen": "0", "X-Mailjet-TrackClick": "0" },
    ...extraParams,
  };

  return new Promise((resolve, reject) => {
    mailTransport.sendMail(mail, (error, info) =>
      error ? reject(error) : resolve(info),
    );
  });
}

export function capitalizeWords(arr: string) {
  return arr
    .split("")
    .map((element) => {
      return element.charAt(0).toUpperCase() + element.slice(1).toLowerCase();
    })
    .join("");
}

export function buildBetaEmail(id: string) {
  return `${id}@${config.domain}`;
}

export const isBetaEmail = (email) =>
  email && email.endsWith(`${config.domain}`);

export const getBetaEmailId = (email) => email && email.split("@")[0];

export function objectArrayToCSV<T extends Record<string, any>>(
  arr: T[],
): string {
  if (arr.length === 0) {
    return "";
  }

  const replacer = (key, value) => (value === null ? "" : value);
  const header = Object.keys(arr[0]);
  const csv = [
    header.join(";"),
    ...arr.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(";"),
    ),
  ].join("\r\n");
  return csv;
}

export function checkUserIsExpired(
  user: memberSchemaType | memberBaseInfoSchemaType,
  minDaysOfExpiration: number = 1,
) {
  if (!user) return false;
  if (!user.missions || !user.missions.length) return true;
  const latestMission = user.missions.reduce((a, v) =>
    //@ts-ignore todo
    !v.end || v.end > a.end ? v : a,
  );
  if (!latestMission.end) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  //@ts-ignore todo
  const userEndDate = new Date(latestMission.end);
  if (userEndDate.toString() === "Invalid Date") return false;
  userEndDate.setHours(0, 0, 0, 0);
  return (
    userEndDate.getTime() + minDaysOfExpiration * 24 * 3600 * 1000 <=
    today.getTime()
  );
}

export function getActiveUsers<
  T extends memberSchemaType[] | memberBaseInfoSchemaType[],
>(users: T, minDaysOfExpiration = 0): T {
  return users.filter(
    (u) => !checkUserIsExpired(u, minDaysOfExpiration - 1),
  ) as T;
}

export function getExpiredUsers<
  T extends memberSchemaType[] | memberBaseInfoSchemaType[],
>(users: T, minDaysOfExpiration = 0): T {
  return users.filter((u) =>
    checkUserIsExpired(u, minDaysOfExpiration - 1),
  ) as T;
}

export function getExpiredUsersForXDays<
  T extends memberSchemaType[] | memberBaseInfoSchemaType[],
>(users: T, nbDays: number): T {
  const date = new Date();
  date.setDate(date.getDate() - nbDays);
  return users.filter((user) => {
    const latestMission = user.missions.reduce((a, v) =>
      !v.end || (a.end ? new Date(v.end) > new Date(a.end) : false) ? v : a,
    );
    return latestMission.end
      ? compareAsc(startOfDay(latestMission.end), startOfDay(date)) === 0
      : false;
  }) as T;
}

export function requiredError(formValidationErrors, field) {
  formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
}

export function isAdminEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const blacklistRegex =
    /.*(?:admin|administrator|support|root|sysadmin|superuser|team|staff|moderator|service|helpdesk|contact|management|no-reply|noreply|master|info).*/i;
  return emailRegex.test(email) && blacklistRegex.test(email);
}

export const isPublicServiceEmail = async function (email: string) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === normalizedEmail.length - 1) {
    return false;
  }
  const domain = normalizedEmail.slice(atIndex + 1);
  const blockedDomains = new Set([
    "gmail.com",
    "live.fr",
    "orange.fr",
    "hotmail.fr",
    "hotmail.com",
    "protonmail.com",
    "octo.com",
    "yahoo.fr",
    "yahoo.com",
    "multi.coop",
    "outlook.com",
    "malt.com",
    "free.fr",
  ]);
  if (blockedDomains.has(domain)) {
    return false;
  }
  if (/@pole-emploi\.fr\s*$/.test(normalizedEmail)) {
    return true;
  }
  if (/@france-?travail\.fr\s*$/.test(normalizedEmail)) {
    return true;
  }
  if (/@justice\.fr\s*$/.test(normalizedEmail)) {
    return true;
  }
  if (/@.*\.gouv\.fr$/.test(normalizedEmail)) {
    return true;
  }
  if (/@betagouv\.ovh$/.test(normalizedEmail)) {
    return true;
  }
  try {
    if (config.tchap_api) {
      console.log(`Tchap API: test ${email}`);
      const data = await axios
        .get(config.tchap_api + String(email).toLowerCase())
        .then((x) => x.data);
      console.log(`Tchap API: test ${email}: ${data.hs}`);
      if (data.hs === "agent.externe.tchap.gouv.fr") {
        return false;
      } else {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error("Tchap API error", e);
    return false;
  }
};

export async function userInfos(
  params: { username: string } | { uuid: string },
  isCurrentUser: boolean,
): Promise<memberWrapperSchemaType> {
  try {
    const userInfos = userInfosToModel(
      await getUserInfos({
        ...params,
        options: { withDetails: true },
      }),
    );
    const dinumEmails = await getDimailEmailsByUser(userInfos.uuid, "mailbox");
    const dinumAliases = await getDimailEmailsByUser(userInfos.uuid, "alias");

    let emailInfos,
      emailRedirections: Redirection[] = [];
    if (dinumEmails && dinumEmails.length) {
      emailInfos = {
        email: dinumEmails[0].email,
        isBlocked: false,
        emailPlan: EMAIL_PLAN_TYPE.EMAIL_PLAN_OPI,
      };
    }
    if (dinumAliases && dinumAliases.length) {
      emailRedirections = dinumAliases.map((a) => ({
        from: a.email,
        to: a.destination || "",
        id: a.uuid,
      }));
    }

    const isExpired = checkUserIsExpired(userInfos);

    const canChangePassword = !!(!isExpired && isCurrentUser && emailInfos);
    const canChangeEmails = !!(!isExpired && isCurrentUser);
    const hasPublicServiceEmail = userInfos.primary_email
      ? await isPublicServiceEmail(userInfos.primary_email)
      : false;

    return {
      isExpired,
      userInfos: userInfos,
      authorizations: {
        canChangePassword,
        canChangeEmails,
        hasPublicServiceEmail,
      },
      emailInfos,
      emailRedirections,
    };
  } catch (err) {
    console.error(err);

    throw new Error(
      `Problème pour récupérer les infos du membre ${
        "username" in params ? params.username : params.uuid
      }`,
    );
  }
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
