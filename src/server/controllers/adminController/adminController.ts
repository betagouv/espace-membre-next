import PromiseMemoize from "promise-memoize";

import BetaGouv from "../../betagouv";
import betagouv from "../../betagouv";
import db from "../../db";
import * as utils from "../utils";
import { getBetaEmailId, isBetaEmail } from "../utils";
import { CommunicationEmailCode, DBUser } from "@/models/dbUser/dbUser";
import { Domaine, Member } from "@/models/member";
import { OvhRedirection } from "@/models/ovh";
import config from "@/server/config";
import {
    getAllDBUsersAndMission,
    getAllUsersPublicInfo,
} from "@/server/db/dbUser";
import { makeSendinblue } from "@infra/email/sendInBlue";

// const emailWithMetadataMemoized = PromiseMemoize(
//     async () => {
//         const [accounts, redirections, users] = await Promise.all([
//             BetaGouv.accounts(),
//             BetaGouv.redirections(),
//             getAllUsersPublicInfo(),
//         ]);
//         const emails = Array.from(
//             new Set([
//                 // Process redirections
//                 ...redirections.reduce<string[]>((acc, r) => {
//                     if (!isBetaEmail(r.to)) {
//                         acc.push(r.from);
//                     }
//                     return acc;
//                 }, []),
//                 // Process accounts
//                 ...accounts.map(utils.buildBetaEmail),
//             ])
//         ).sort();

//         return emails.map((email) => {
//             const id = getBetaEmailId(email);
//             const user = users.find((ui) => ui.username === id);

//             return {
//                 id,
//                 email,
//                 github: user !== undefined,
//                 redirections: redirections.reduce(
//                     (acc, r) => (r.from === email ? [...acc, r.to] : acc),
//                     [] as string[]
//                 ),
//                 account: accounts.includes(id),
//                 endDate: user ? user.end : undefined,
//                 expired:
//                     user &&
//                     user.end &&
//                     new Date(user.end).getTime() < new Date().getTime(),
//             };
//         });
//     },
//     {
//         maxAge: 120000,
//     }
// );

export async function getSendinblueInfo(req, res) {
    const sendInBlueTech = makeSendinblue({
        MAIL_SENDER: config.senderEmail,
        SIB_APIKEY_PUBLIC: config.SIB_APIKEY_TECH_PUBLIC,
        SIB_APIKEY_PRIVATE: config.SIB_APIKEY_TECH_PRIVATE,
        htmlBuilder: undefined,
    });

    const startDate = new Date();
    const endDate = new Date();

    // Set it to one month ago
    startDate.setMonth(startDate.getMonth() - 1);

    const techTransacBlockedContact =
        await sendInBlueTech.getAllTransacBlockedContacts({
            startDate,
            endDate,
            offset: 0,
        });

    const sendInBlueCommu = makeSendinblue({
        MAIL_SENDER: config.senderEmail,
        SIB_APIKEY_PUBLIC: config.SIB_APIKEY_PUBLIC,
        SIB_APIKEY_PRIVATE: config.SIB_APIKEY_PRIVATE!,
        htmlBuilder: undefined,
    });

    let contacts = await sendInBlueCommu.getAllContactsFromList({
        listId: config.MAILING_LIST_NEWSLETTER!,
    }); // SIB newsletter mailing list
    contacts = contacts.filter((c) => c.emailBlacklisted);
    const commuTransacBlockedContact =
        await sendInBlueCommu.getAllTransacBlockedContacts({
            startDate,
            endDate,
            offset: 0,
        });

    return res.json({
        contacts,
        commuTransacBlockedContact,
        techTransacBlockedContact,
    });
}

export async function getUsers(req, res) {
    const domaines = req.query.domaines
        ? req.query.domaines.split(",").map((domaine) => Domaine[domaine])
        : [];
    const incubators = req.query.incubators
        ? req.query.incubators.split(",")
        : [];
    const startupPhases = req.query.startupPhases
        ? req.query.startupPhases.split(",")
        : [];
    const memberStatus = req.query.memberStatus;
    let startups = req.query.startups ? req.query.startups.split(",") : [];
    // const activeMembers = req.params.activeMembers
    let users = await getAllDBUsersAndMission();
    if (memberStatus === "unactive") {
        users = utils.getExpiredUsers(users);
    } else if (memberStatus === "active") {
        users = utils.getActiveUsers(users);
    }
    if (incubators.length) {
        const incubatorsDict = await betagouv.incubators();
        const incubatorStartups = incubators.reduce((acc, incubator) => {
            return [
                ...acc,
                ...incubatorsDict[incubator].startups.map((s) => s.id),
            ];
        }, []);
        startups = [...startups, ...incubatorStartups];
    }
    if (domaines.length) {
        users = users.filter((user) => domaines.includes(user.domaine));
    }
    if (startupPhases.length) {
        const usersStartupsByPhase: UserStartup[] = await db("users_startups")
            .whereIn(
                "user_id",
                users.map((user) => user.username)
            )
            .join("startups", "users_startups.startup_id", "startups.id")
            .whereIn("startups.current_phase", startupPhases);
        const usersByPhaseIds = usersStartupsByPhase.map(
            (item) => item.user_id
        );
        users = users.filter((user) => usersByPhaseIds.includes(user.username));
    }
    // todo fix
    // if (startups.length) {
    //     users = users.filter((user) => {
    //         return Boolean(
    //             startups.filter(function (n) {
    //                 return (user.startups || []).indexOf(n) !== -1;
    //             }).length
    //         );
    //     });
    // }
    const dbUsers: DBUser[] = await db("users").whereIn(
        "username",
        users.map((user) => user.username)
    );
    if (
        process.env.ESPACE_MEMBRE_ADMIN &&
        process.env.ESPACE_MEMBRE_ADMIN.includes(req.auth.id)
    ) {
        users = users.map((user) => {
            const dbUser = dbUsers.find(
                (dbUser) => dbUser.username === user.username
            );
            return {
                ...user,
                primaryEmail: dbUser ? dbUser.primary_email : "",
                secondaryEmail: dbUser ? dbUser.secondary_email : "",
                workplace_insee_code: dbUser ? dbUser.workplace_insee_code : "",
                communicationEmail: dbUser
                    ? dbUser.communication_email ===
                          CommunicationEmailCode.SECONDARY &&
                      dbUser.secondary_email
                        ? dbUser.secondary_email
                        : dbUser.primary_email
                    : "",
            };
        });
    }
    res.json({ users });
}
