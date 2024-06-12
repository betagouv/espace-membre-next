import axios from "axios";
import crypto from "crypto";
import _ from "lodash";
import nodemailer from "nodemailer";

import { getUserInfos } from "@/lib/kysely/queries/users";
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
    // - son/sa date de fin est passée
    // todo what to do with user.end

    if (!user || !user.missions || !user.missions.length) return false;
    const latestMission = user.missions.reduce((a, v) =>
        //@ts-ignore todo
        !v.end || v.end > a.end ? v : a
    );
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
        // Assuming `latestMission.end` is a date string, compare against `formattedDate`.
        return latestMission.end === date;
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

export function isValidEmail(formValidationErrors, field, email) {
    const emailRegex =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (emailRegex.test(email.toLowerCase())) {
        return email;
    }
    formValidationErrors.push(`${field} : l'adresse email n'est pas valide`);
    return null;
}

export async function isPublicServiceEmail(email) {
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
        throw new Error("Get response from tchap error");
    }
}

export const asyncFilter = async (arr: Array<any>, predicate) => {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
};

export async function userInfos(
    id: string,
    isCurrentUser: boolean
): Promise<memberWrapperSchemaType> {
    try {
        const userInfos = userInfosToModel(
            await getUserInfos({
                username: id,
                options: { withDetails: true },
            })
        );
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
        const hasPublicServiceEmail = await isPublicServiceEmail(
            userInfos.primary_email
        );
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

        throw new Error(`Problème pour récupérer les infos du membre ${id}`);
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
