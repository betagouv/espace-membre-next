import * as utils from "../utils";
import { db } from "@/lib/kysely";
import { adminGetAllUsersInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { CommunicationEmailCode } from "@/models/member";
import { Domaine } from "@/models/member";
import config from "@/server/config";
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

// export async function getSendinblueInfo(req, res) {
//     const sendInBlueTech = makeSendinblue({
//         MAIL_SENDER: config.senderEmail,
//         SIB_APIKEY_PUBLIC: config.SIB_APIKEY_TECH_PUBLIC,
//         SIB_APIKEY_PRIVATE: config.SIB_APIKEY_TECH_PRIVATE,
//         htmlBuilder: undefined,
//     });

//     const startDate = new Date();
//     const endDate = new Date();

//     // Set it to one month ago
//     startDate.setMonth(startDate.getMonth() - 1);

//     const techTransacBlockedContact =
//         await sendInBlueTech.getAllTransacBlockedContacts({
//             startDate,
//             endDate,
//             offset: 0,
//         });

//     const sendInBlueCommu = makeSendinblue({
//         MAIL_SENDER: config.senderEmail,
//         SIB_APIKEY_PUBLIC: config.SIB_APIKEY_PUBLIC,
//         SIB_APIKEY_PRIVATE: config.SIB_APIKEY_PRIVATE!,
//         htmlBuilder: undefined,
//     });

//     let contacts = await sendInBlueCommu.getAllContactsFromList({
//         listId: config.MAILING_LIST_NEWSLETTER!,
//     }); // SIB newsletter mailing list
//     contacts = contacts.filter((c) => c.emailBlacklisted);
//     const commuTransacBlockedContact =
//         await sendInBlueCommu.getAllTransacBlockedContacts({
//             startDate,
//             endDate,
//             offset: 0,
//         });

//     return res.json({
//         contacts,
//         commuTransacBlockedContact,
//         techTransacBlockedContact,
//     });
// }
