import axios from "axios";
import crypto, { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { compareAsc, startOfDay } from "date-fns";
import _ from "lodash";
import nodemailer from "nodemailer";

import { getUserEvents } from "@/lib/kysely/queries/userEvents";
import { getUserInfos, getUserStartups } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import {
    memberBaseInfoSchemaType,
    memberSchemaType,
    memberWrapperSchemaType,
} from "@/models/member";
import config from "@/server/config";
import BetaGouv from "@betagouv";

export const computeHash = function (username) {
    const hash = crypto.createHmac(
        "sha512",
        config.HASH_SALT as string
    ); /** Hashing algorithm sha512 */
    return hash.update(username).digest("hex");
};

export function encryptPassword(password) {
    const iv = randomBytes(16); // Generate a secure, random IV

    const cipher = createCipheriv(
        "aes-256-cbc",
        new Uint8Array(Buffer.from(config.PASSWORD_ENCRYPT_KEY!, "hex")),
        new Uint8Array(iv)
    );
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`; // Combine iv and encrypted content
}

// Function to decrypt the password
export function decryptPassword(encryptedPassword) {
    const key = Buffer.from(config.PASSWORD_ENCRYPT_KEY!, "hex");
    const [ivHex, encrypted] = encryptedPassword.split(":");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = createDecipheriv(
        "aes-256-cbc",
        new Uint8Array(key),
        new Uint8Array(iv)
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
    attachments = []
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
            error ? reject(error) : resolve(info)
        );
    });
}

export function capitalizeWords(arr: string) {
    return arr
        .split("")
        .map((element) => {
            return (
                element.charAt(0).toUpperCase() + element.slice(1).toLowerCase()
            );
        })
        .join("");
}

export function buildBetaEmail(id: string) {
    return `${id}@${config.domain}`;
}

export function buildBetaRedirectionEmail(
    id: string,
    postfix: string = "attr"
) {
    return `${id}-attr@${config.domain}`;
}

export const isBetaEmail = (email) =>
    email && email.endsWith(`${config.domain}`);

export const getBetaEmailId = (email) => email && email.split("@")[0];

export function objectArrayToCSV<T extends Record<string, any>>(
    arr: T[]
): string {
    if (arr.length === 0) {
        return ""; // or handle empty array case as needed
    }

    const replacer = (key, value) => (value === null ? "" : value); // specify how you want to handle null values here
    const header = Object.keys(arr[0]);
    const csv = [
        header.join(";"), // header row first
        ...arr.map((row) =>
            header
                .map((fieldName) => JSON.stringify(row[fieldName], replacer))
                .join(";")
        ),
    ].join("\r\n");
    return csv;
}

export function checkUserIsExpired(
    user: memberSchemaType | memberBaseInfoSchemaType,
    minDaysOfExpiration: number = 1
) {
    // Le membre est considéré comme expiré si:
    // - il/elle existe
    // - il/elle a une date de fin
    // - son/sa date de fin est passée ou pas de mission
    // todo what to do with user.end

    if (!user) return false;
    if (!user.missions || !user.missions.length) return true;
    const latestMission = user.missions.reduce((a, v) =>
        //@ts-ignore todo
        !v.end || v.end > a.end ? v : a
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
    T extends memberSchemaType[] | memberBaseInfoSchemaType[]
>(users: T, minDaysOfExpiration = 0): T {
    return users.filter(
        (u) => !checkUserIsExpired(u, minDaysOfExpiration - 1)
    ) as T;
}

export function getExpiredUsers<
    T extends memberSchemaType[] | memberBaseInfoSchemaType[]
>(users: T, minDaysOfExpiration = 0): T {
    return users.filter((u) =>
        checkUserIsExpired(u, minDaysOfExpiration - 1)
    ) as T;
}

export function getExpiredUsersForXDays<
    T extends memberSchemaType[] | memberBaseInfoSchemaType[]
>(users: T, nbDays: number): T {
    const date = new Date();
    date.setDate(date.getDate() - nbDays);
    // Assuming you need to compare dates, convert to YYYY-MM-DD format.
    // const formattedDate = date.toISOString().slice(0, 10);
    return users.filter((user) => {
        const latestMission = user.missions.reduce((a, v) =>
            !v.end || (a.end ? new Date(v.end) > new Date(a.end) : false)
                ? v
                : a
        );
        // Compare the normalized dates
        return latestMission.end
            ? compareAsc(startOfDay(latestMission.end), startOfDay(date)) === 0
            : false;
    }) as T;
}

export function isMobileFirefox(req) {
    const userAgent = Object.prototype.hasOwnProperty.call(
        req.headers,
        "user-agent"
    )
        ? req.headers["user-agent"]
        : null;
    return userAgent && /Android.+Firefox\//.test(userAgent);
}

export function requiredError(formValidationErrors, field) {
    formValidationErrors.push(`${field} : le champ n'est pas renseigné`);
}

export function isAdminEmail(email: string): boolean {
    // a user should not use an admin email as access are personnal
    // Basic email format regex (RFC 5322 compliant)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Regex to block suspicious email patterns
    const blacklistRegex =
        /.*(?:admin|administrator|support|root|sysadmin|superuser|team|staff|moderator|service|helpdesk|contact|management|no-reply|noreply|master|info).*/i;
    // Check if the email matches the valid email regex and does not match the blacklist
    return emailRegex.test(email) && blacklistRegex.test(email);
}

export const isPublicServiceEmail = async function (email: string) {
    if (process.env.NODE_ENV === "development") {
        return true;
    }
    if (/@pole-emploi.fr\s*$/.test(email.toLowerCase())) {
        return true;
    }
    try {
        const data = await axios
            .get(config.tchap_api + String(email).toLowerCase())
            .then((x) => x.data);
        if (data.hs === "agent.externe.tchap.gouv.fr") {
            return false;
        } else {
            return true;
        }
    } catch (e) {
        console.error(e);
        //throw new Error("Get response from tchap error");
        return false;
    }
};

export const asyncFilter = async (arr: Array<any>, predicate) => {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
};

export async function userInfos(
    params: { username: string } | { uuid: string },
    isCurrentUser: boolean
): Promise<memberWrapperSchemaType> {
    try {
        const userInfos = userInfosToModel(
            await getUserInfos({
                ...params,
                options: { withDetails: true },
            })
        );
        // TODO: check if email OPI
        const emailInfos = await BetaGouv.emailInfos(userInfos.username);
        const emailRedirections = await BetaGouv.redirectionsForId({
            from: userInfos.username,
        });
        const emailResponder = await BetaGouv.getResponder(userInfos.username);
        const isExpired = checkUserIsExpired(userInfos);
        // On ne peut créé un compte que si:
        // - la page fiche Github existe
        // - le membre n'est pas expiré·e
        // - et le compte n'existe pas
        const canCreateEmail = !isExpired && emailInfos === null;
        // On peut créer une redirection & changer un password si:
        // - la page fiche Github existe
        // - le membre n'est pas expiré·e (le membre ne devrait de toute façon pas pouvoir se connecter)
        // - et que l'on est le membre connecté·e pour créer ces propres redirections.
        const canCreateRedirection = !!(!isExpired && isCurrentUser);
        const canChangePassword = !!(!isExpired && isCurrentUser && emailInfos);
        const canChangeEmails = !!(!isExpired && isCurrentUser);
        const hasPublicServiceEmail = userInfos.primary_email
            ? await isPublicServiceEmail(userInfos.primary_email)
            : false;

        return {
            isExpired,
            userInfos: userInfos,
            emailResponder,
            authorizations: {
                canCreateEmail,
                canCreateRedirection,
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
            }`
        );
    }
}

export function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 *@param	{String} date1 A date in ISO format to compare to the other one.
 *@param	{String} date2 A date in ISO format to compare to the other one.
 */
export function sortASC(date1, date2) {
    return date1 < date2 ? -1 : 1;
}

/**
 *@param	{Date} date     A date to convert to an ISO formated day.
 */
export function formatDateToISOString(date) {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) {
        month = "0" + month;
    }
    if (day.length < 2) {
        day = "0" + day;
    }

    return [year, month, day].join("-");
}

/**
 *@param	{Array} keys An array of strings
 *@param {Int} value A value to assign to each key
 */
export function createDefaultObjectWithKeysAndValue(keys, value = 0) {
    const obj = {};
    for (const key of keys) {
        obj[key] = value;
    }
    return obj;
}
