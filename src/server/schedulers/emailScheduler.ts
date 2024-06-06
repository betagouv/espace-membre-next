import crypto from "crypto";
import _ from "lodash/array";

import betagouv from "../betagouv";
import { createEmail } from "../controllers/usersController/createEmailForUser";
import { addEvent } from "@/lib/events";
import { getAllUsersInfo } from "@/lib/kysely/queries/users";
import { ActionEvent, EventCode } from "@/models/actionEvent";
import {
    CommunicationEmailCode,
    DBUser,
    DBUserAndMission,
    DBUserPublic,
    DBUserPublicAndMission,
    EmailStatusCode,
    MemberType,
} from "@/models/dbUser/dbUser";
import { memberBaseInfoToModel, userInfosToModel } from "@/models/mapper";
import { Member } from "@/models/member";
import { OvhRedirection } from "@/models/ovh";
import config from "@/server/config";
import {
    addContactsToMailingLists,
    sendEmail,
    smtpBlockedContactsEmailDelete,
} from "@/server/config/email.config";
import BetaGouv from "@betagouv";
import {
    setEmailActive,
    setEmailRedirectionActive,
    setEmailSuspended,
} from "@controllers/usersController";
import * as utils from "@controllers/utils";
import { isBetaEmail } from "@controllers/utils";
import knex from "@db";
import { EMAIL_TYPES, MAILING_LIST_TYPE } from "@modules/email";

const differenceGithubOVH = function differenceGithubOVH(user, ovhAccountName) {
    return user.id === ovhAccountName;
};

const differenceGithubRedirectionOVH = function differenceGithubOVH(
    user,
    ovhAccountName
) {
    return utils.buildBetaRedirectionEmail(user.id) === ovhAccountName;
};

const getValidUsers = async () => {
    const githubUsers = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user)
    );
    return githubUsers.filter((x) => !utils.checkUserIsExpired(x));
};

export async function setEmailAddressesActive() {
    const fiveMinutesInMs: number = 5 * 1000 * 60;
    const nowLessFiveMinutes: Date = new Date(Date.now() - fiveMinutesInMs);
    const dbUsers: DBUser[] = await knex("users")
        .whereIn("primary_email_status", [
            EmailStatusCode.EMAIL_CREATION_PENDING,
            EmailStatusCode.EMAIL_RECREATION_PENDING,
        ])
        .where("primary_email_status_updated_at", "<", nowLessFiveMinutes);
    const githubUsers = await getValidUsers();
    const concernedUsers: DBUser[] = dbUsers.filter((user) => {
        return githubUsers.find((x) => user.username === x.username);
    });
    return Promise.all(
        concernedUsers.map(async (user) => {
            const listTypes = [MAILING_LIST_TYPE.NEWSLETTER];
            if (
                user.primary_email_status ===
                EmailStatusCode.EMAIL_CREATION_PENDING
            ) {
                listTypes.push(MAILING_LIST_TYPE.ONBOARDING);
            }
            await addContactsToMailingLists({
                listTypes: listTypes,
                contacts: [
                    {
                        email: (user.communication_email ===
                            CommunicationEmailCode.SECONDARY &&
                        user.secondary_email
                            ? user.secondary_email
                            : user.primary_email) as string,
                        firstname: utils.capitalizeWords(
                            user?.username?.split(".")[0]
                        ),
                        lastname: utils.capitalizeWords(
                            user.username.split(".")[1]
                        ),
                        domaine: githubUsers.find(
                            (x) => user.username === x.username
                        )?.domaine,
                    },
                ],
            });
            await smtpBlockedContactsEmailDelete({
                email: user.primary_email as string,
            });
            await setEmailActive(user.username);
            // once email created we create marrainage
        })
    );
}

export async function setCreatedEmailRedirectionsActive() {
    const fiveMinutesInMs: number = 5 * 1000 * 60;
    const nowLessFiveMinutes: Date = new Date(Date.now() - fiveMinutesInMs);
    const dbUsers: DBUser[] = await knex("users")
        .whereIn("primary_email_status", [
            EmailStatusCode.EMAIL_REDIRECTION_PENDING,
        ])
        .where("primary_email_status_updated_at", "<", nowLessFiveMinutes)
        .where("email_is_redirection", true);

    const githubUsers = await getValidUsers();
    const concernedUsers: DBUser[] = dbUsers.filter((user) => {
        return githubUsers.find((x) => user.username === x.username);
    });
    return Promise.all(
        concernedUsers.map(async (user) => {
            if (user.member_type === MemberType.ATTRIBUTAIRE) {
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
                                CommunicationEmailCode.SECONDARY &&
                            user.secondary_email
                                ? user.secondary_email
                                : user.primary_email) as string,
                            firstname: utils.capitalizeWords(
                                user.username.split(".")[0]
                            ),
                            lastname: utils.capitalizeWords(
                                user.username.split(".")[1]
                            ),
                            domaine: githubUsers.find(
                                (x) => user.username === x.username
                            )?.domaine,
                        },
                    ],
                });
            }
            await smtpBlockedContactsEmailDelete({
                email: user.primary_email as string,
            });
            await setEmailRedirectionActive(user.username);
            // once email created we create marrainage
        })
    );
}

export async function createRedirectionEmailAdresses() {
    const dbUsers: DBUser[] = await knex("users")
        .whereNull("primary_email")
        .whereIn("primary_email_status", [
            EmailStatusCode.EMAIL_CREATION_WAITING,
        ])
        .where("email_is_redirection", true)
        .whereNotNull("secondary_email");
    const githubUsers = await getValidUsers();
    const concernedUsers = githubUsers.filter((user) => {
        return dbUsers.find((x) => x.username === user.username);
    });

    const redirections: OvhRedirection[] = await BetaGouv.redirections();

    const allOvhRedirectionEmails = Array.from(
        new Set([
            ...(redirections.reduce(
                (acc: string[], r) =>
                    !isBetaEmail(r.to) ? [...acc, r.from] : acc,
                []
            ) as []),
        ])
    ).sort();
    let unregisteredMembers: DBUserAndMission[] = _.differenceWith(
        concernedUsers,
        allOvhRedirectionEmails,
        differenceGithubRedirectionOVH
    );
    console.log(
        `Email creation : ${unregisteredMembers.length} unregistered user(s) in OVH (${allOvhRedirectionEmails.length} accounts in OVH. ${githubUsers.length} accounts in Github).`
    );
    unregisteredMembers = unregisteredMembers.map((member) => {
        const dbUser = dbUsers.find(
            (dbUser) => dbUser.username === member.username
        );

        // if (dbUser) {
        //     member.email = dbUser.secondary_email;
        // }
        return member;
    });
    console.log(
        "User that should have redirection",
        unregisteredMembers.map((u) => u.username)
    );
    // create email and marrainage
    return Promise.all(
        unregisteredMembers.map(async (member) => {
            if (
                process.env.FEATURE_APPLY_CREATE_REDIRECTION_EMAIL ||
                process.env.NODE_ENV === "test"
            ) {
                const email = utils.buildBetaRedirectionEmail(
                    member.username,
                    "attr"
                );
                await betagouv.createRedirection(
                    email,
                    member.secondary_email,
                    false
                );
                const [user]: DBUser[] = await knex("users")
                    .where({
                        username: member.username,
                    })
                    .update({
                        primary_email: email,
                        primary_email_status:
                            EmailStatusCode.EMAIL_REDIRECTION_PENDING,
                        primary_email_status_updated_at: new Date(),
                    })
                    .returning("*");
                console.log(`Email redirection créée pour ${user.username}`);
            }
        })
    );
}

export async function createEmailAddresses() {
    const dbUsers: DBUser[] = await knex("users")
        .whereNull("primary_email")
        .whereIn("primary_email_status", [
            EmailStatusCode.EMAIL_CREATION_WAITING,
        ])
        .where("email_is_redirection", false)
        .whereNotNull("secondary_email");
    const githubUsers = await getValidUsers();

    const concernedUsers = githubUsers.filter((user) => {
        return dbUsers.find((x) => x.username === user.username);
    });

    const allOvhEmails: string[] = await BetaGouv.getAllEmailInfos();
    const unregisteredUsers: DBUserPublic[] = _.differenceWith(
        concernedUsers,
        allOvhEmails,
        differenceGithubOVH
    );
    console.log(
        `Email creation : ${unregisteredUsers.length} unregistered user(s) in OVH (${allOvhEmails.length} accounts in OVH. ${githubUsers.length} accounts in Github).`
    );

    // create email and marrainage
    return Promise.all(
        unregisteredUsers.map(async (user) => {
            await createEmail(user.username, "Secretariat cron");
            // once email created we create marrainage
        })
    );
}

export async function reinitPasswordEmail() {
    const users = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user)
    );
    const expiredUsers = utils.getExpiredUsers(users, 5);
    const dbUsers: DBUser[] = await knex("users")
        .whereIn(
            "username",
            expiredUsers.map((user) => user.username)
        )
        .andWhere({
            primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
        });
    return Promise.all(
        dbUsers.map(async (user) => {
            const { emailInfos } = await utils.userInfos(user.username, false);
            const newPassword = crypto
                .randomBytes(16)
                .toString("base64")
                .slice(0, -2);
            try {
                await BetaGouv.changePassword(
                    user.username,
                    newPassword,
                    emailInfos?.emailPlan
                );
                await setEmailSuspended(user.username);
                console.log(
                    `Le mot de passe de ${
                        user.username
                    } a été modifié car son contrat finissait le ${new Date()}.`
                );
            } catch (err) {
                console.log(
                    `Le mode de passe de ${user.username} n'a pas pu être modifié: ${err}`
                );
            }
        })
    );
}

export async function subscribeEmailAddresses() {
    // const dbUsers: DBUser[] = await knex("users").whereNotNull("primary_email");

    const githubUsers = await getValidUsers();
    const concernedUsers = githubUsers.filter((u) => u.primary_email);
    // const concernedUsers = githubUsers.reduce(
    //     (acc: (Member & { primary_email: string | undefined })[], user) => {
    //         const dbUser = dbUsers.find((x) => x.username === user.username);
    //         if (dbUser) {
    //             acc.push({
    //                 ...user,
    //                 ...{ primary_email: dbUser.primary_email },
    //             });
    //         }
    //         return acc;
    //     },
    //     []
    // );

    const allIncubateurSubscribers = await BetaGouv.getMailingListSubscribers(
        config.incubateurMailingListName
    );
    const unsubscribedUsers = concernedUsers
        .filter((concernedUser) => {
            return !allIncubateurSubscribers.find(
                (email) =>
                    email.toLowerCase() ===
                    concernedUser?.primary_email?.toLowerCase()
            );
        })
        .filter((user) => user.primary_email);
    console.log(
        `Email subscription : ${unsubscribedUsers.length} unsubscribed user(s) in incubateur mailing list.`
    );

    // create email and marrainage
    return Promise.all(
        unsubscribedUsers.map(async (user) => {
            await BetaGouv.subscribeToMailingList(
                config.incubateurMailingListName,
                user.primary_email as string
            );
            console.log(
                `Subscribe ${user.primary_email} to mailing list incubateur`
            );
        })
    );
}

export async function unsubscribeEmailAddresses() {
    // const dbUsers: DBUser[] = await knex("users").whereNotNull("primary_email");
    const concernedUsers = (await getAllUsersInfo())
        .map((user) => memberBaseInfoToModel(user))
        .filter((x) => utils.checkUserIsExpired(x) && x.primary_email);

    // const concernedUsers = githubUsers.reduce(
    //     (acc: (Member & { primary_email: string | undefined })[], user) => {
    //         const dbUser = dbUsers.find((x) => x.username === user.username);
    //         if (dbUser) {
    //             acc.push({
    //                 ...user,
    //                 ...{ primary_email: dbUser.primary_email },
    //             });
    //         }
    //         return acc;
    //     },
    //     []
    // );

    const allIncubateurSubscribers: string[] =
        await BetaGouv.getMailingListSubscribers(
            config.incubateurMailingListName
        );
    const emails = allIncubateurSubscribers.filter((email) => {
        return concernedUsers.find(
            (concernedUser) =>
                email.toLowerCase() ===
                concernedUser?.primary_email?.toLowerCase()
        );
    });

    console.log(
        `Email unsubscription : ${emails.length} subscribed user(s) in incubateur mailing list.`
    );

    // create email and marrainage
    return Promise.all(
        emails.map(async (email) => {
            await BetaGouv.unsubscribeFromMailingList(
                config.incubateurMailingListName,
                email
            );
            console.log(`Unsubscribe ${email} from mailing list incubateur`);
        })
    );
}

export async function setEmailStatusActiveForUsers() {
    const dbUsers: DBUser[] = await knex("users")
        .whereNull("primary_email")
        .whereIn("primary_email_status", [EmailStatusCode.EMAIL_UNSET])
        .whereNotNull("secondary_email");
    const activeUsers = await BetaGouv.getActiveRegisteredOVHUsers();

    const concernedUsers = activeUsers.filter((user) => {
        return dbUsers.find((x) => x.username === user.username);
    });

    // create email and marrainage
    return Promise.all(
        concernedUsers.map(async (user) => {
            console.log("This user has active email", user.username);
            // once email created we create marrainage
        })
    );
}

export async function sendOnboardingVerificationPendingEmail() {
    const dbUsers: DBUser[] = await knex("users").whereIn(
        "primary_email_status",
        [EmailStatusCode.EMAIL_VERIFICATION_WAITING]
    );

    const githubUsers = await getValidUsers();
    const concernedUsers: DBUser[] = dbUsers.filter((user) => {
        return githubUsers.find((x) => user.username === x.username);
    });
    concernedUsers.map(async (user) => {
        const secretariatUrl = `${config.protocol}://${config.host}`;
        const event: ActionEvent = await knex("events")
            .where({
                action_code: EventCode.EMAIL_VERIFICATION_WAITING_SENT,
                action_on_username: user.username,
            })
            .first();
        if (!event) {
            await sendEmail({
                type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING,
                toEmail: [user.secondary_email],
                variables: {
                    secondaryEmail: user.secondary_email,
                    secretariatUrl,
                },
            });
            await addEvent({
                action_code: EventCode.EMAIL_VERIFICATION_WAITING_SENT,
                created_by_username: "system",
                action_on_username: user.username,
            });
        }
    });
}
