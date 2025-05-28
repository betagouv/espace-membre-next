import { differenceInDays, format, startOfDay } from "date-fns";

import { matomoClient } from "../config/matomo.config";
import { sentryClient } from "../config/sentry.config";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import {
    getAllExpiredUsers,
    getAllUsersInfo,
} from "@/lib/kysely/queries/users";
import * as mattermost from "@/lib/mattermost";
import { EventCode, SYSTEM_NAME } from "@/models/actionEvent";
import { Job } from "@/models/job";
import { memberBaseInfoToModel } from "@/models/mapper";
import {
    CommunicationEmailCode,
    EmailStatusCode,
    memberBaseInfoAndMattermostWrapperType,
    memberBaseInfoSchemaType,
} from "@/models/member";
import { OvhRedirection } from "@/models/ovh";
import { AccountService } from "@/models/services";
import { sendEmail } from "@/server/config/email.config";
import BetaGouv from "@betagouv";
import * as utils from "@controllers/utils";
import { sleep } from "@controllers/utils";
import { removeContactsFromMailingList } from "@infra/email/sendInBlue";
import {
    EmailEndingContract,
    EmailNoMoreContract,
    EMAIL_TYPES,
    MAILING_LIST_TYPE,
} from "@modules/email";
import htmlBuilder from "@modules/htmlbuilder/htmlbuilder";

// get users that are member (got a github card) and mattermost account that is not in the team
const getRegisteredUsersWithEndingContractInXDays = async (
    days: number,
): Promise<memberBaseInfoAndMattermostWrapperType[]> => {
    const allMattermostUsers = await mattermost.getUserWithParams();
    const users: memberBaseInfoSchemaType[] = (await getAllUsersInfo()).map(
        (user) => memberBaseInfoToModel(user),
    );
    const activeGithubUsers = users
        .filter((user) => user.missions.length)
        .filter((user) => {
            const today = new Date();
            const stillActive = !utils.checkUserIsExpired(user);
            const latestMission = user.missions.reduce((a, v) =>
                //@ts-ignore todo
                v.end > a.end || !v.end ? v : a,
            );
            if (!latestMission.end) {
                return false;
            }
            return (
                stillActive &&
                differenceInDays(
                    startOfDay(latestMission.end),
                    startOfDay(today),
                ) === days
            );
        });

    const allMattermostUsersEmails = allMattermostUsers.map(
        (mattermostUser) => mattermostUser.email,
    );

    const registeredUsersWithEndingContractInXDays: memberBaseInfoAndMattermostWrapperType[] =
        [];
    activeGithubUsers.forEach((user) => {
        const index = user.primary_email
            ? allMattermostUsersEmails.indexOf(user.primary_email)
            : -1;

        // const githubUser = activeGithubUsers.find(
        //     (ghUser) => ghUser.username === user.username
        // );
        if (index !== -1 && allMattermostUsers[index].username) {
            registeredUsersWithEndingContractInXDays.push({
                userInfos: user,
                mattermostUsername: allMattermostUsers[index].username,
            });
        }
    });
    return registeredUsersWithEndingContractInXDays;
};

const CONFIG_ENDING_CONTRACT_MESSAGE: Record<
    string,
    {
        type: EmailEndingContract["type"];
        days: EmailEndingContract["variables"]["days"];
    }
> = {
    mail2days: {
        type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_2_DAYS,
        days: 2,
    },
    mail15days: {
        type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_15_DAYS,
        days: 15,
    },
    mail30days: {
        type: EMAIL_TYPES.EMAIL_ENDING_CONTRACT_30_DAYS,
        days: 30,
    },
};

const CONFIG_NO_MORE_CONTRACT_MESSAGE: Record<
    string,
    EmailNoMoreContract["type"]
> = {
    1: EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_1_DAY,
    30: EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_30_DAY,
};

const sendMessageOnChatAndEmail = async ({
    user,
    messageType,
    jobs,
    sendToSecondary,
}: {
    user: memberBaseInfoAndMattermostWrapperType;
    messageType: EmailEndingContract["type"];
    jobs: Job[];
    sendToSecondary: boolean;
    days: EmailEndingContract["variables"]["days"];
}) => {
    const endDate = user.userInfos.missions
        .map((m) => m.end)
        .filter((missionEndDate) => missionEndDate)
        .sort((dateA, dateB) => dateB!.getTime() - dateA!.getTime())[0];
    if (!endDate) {
        throw new Error(
            "Error: Member should have at leat one mission with a end date",
        );
    }
    const variables: EmailEndingContract["variables"] = {
        user: {
            userInfos: user.userInfos,
            mattermostUsername: user.mattermostUsername,
        },
        endDate: endDate,
        jobs: user.userInfos.domaine
            ? jobs
                  .filter((job) =>
                      job.domaines.includes(user.userInfos.domaine),
                  )
                  .slice(0, 3)
            : [],
        days: 2,
    };
    const contentProps = {
        type: messageType,
        variables,
    };
    const messageContent =
        await htmlBuilder.renderContentForTypeAsMarkdown(contentProps);
    try {
        await BetaGouv.sendInfoToChat(
            messageContent,
            "secretariat",
            user.mattermostUsername,
        );
        console.log(
            `Send ending contract (${messageType} days) message on mattermost to ${user.mattermostUsername}`,
        );
        sleep(1000);
    } catch (err) {
        throw new Error(`Erreur d'envoi de mail à l'adresse indiquée ${err}`);
    }
    try {
        let email = user.userInfos.primary_email;
        if (
            (sendToSecondary ||
                user.userInfos.communication_email ===
                    CommunicationEmailCode.SECONDARY) &&
            user.userInfos.secondary_email
        ) {
            email = `${email},${user.userInfos.secondary_email}`;
        }
        if (email) {
            await sendEmail({
                ...contentProps,
                toEmail: email.split(","),
            });
            console.log(
                `Send ending contract (${messageType} days) email to ${email}`,
            );
        }
    } catch (err) {
        throw new Error(`Erreur d'envoi de mail à l'adresse indiquée ${err}`);
    }
};

export async function sendContractEndingMessageToUsers(
    configName: string,
    sendToSecondary = false,
    users = null,
) {
    console.log("Run send contract ending message to users");
    const messageConfig = CONFIG_ENDING_CONTRACT_MESSAGE[configName];
    let registeredUsersWithEndingContractInXDays: memberBaseInfoAndMattermostWrapperType[];
    if (users) {
        registeredUsersWithEndingContractInXDays = users;
    } else {
        registeredUsersWithEndingContractInXDays =
            await getRegisteredUsersWithEndingContractInXDays(
                messageConfig.days,
            );
    }
    const jobs: Job[] = [];
    await Promise.all(
        registeredUsersWithEndingContractInXDays.map(async (user) => {
            await sendMessageOnChatAndEmail({
                user,
                messageType: messageConfig.type,
                sendToSecondary,
                jobs,
                days: messageConfig.days,
            });
        }),
    );
}

export async function sendInfoToSecondaryEmailAfterXDays(
    nbDays: 1 | 30,
    optionalExpiredUsers?: memberBaseInfoSchemaType[],
) {
    let expiredUsers = optionalExpiredUsers;
    if (!expiredUsers) {
        const users = (await getAllUsersInfo()).map((user) =>
            memberBaseInfoToModel(user),
        );
        expiredUsers = utils.getExpiredUsersForXDays(users, nbDays);
    }
    return Promise.all(
        expiredUsers.map(async (user) => {
            try {
                if (user.secondary_email) {
                    const email = user.secondary_email;
                    await sendEmail({
                        type: CONFIG_NO_MORE_CONTRACT_MESSAGE[nbDays],
                        toEmail: [email],
                        variables: {
                            user,
                            days: nbDays,
                        },
                    });
                    console.log(
                        `Envoie du message fin de contrat +${nbDays} à ${email}`,
                    );
                } else {
                    console.error(
                        `Le compte ${user.username} n'a pas d'adresse secondaire`,
                    );
                }
            } catch (err) {
                throw new Error(
                    `Erreur d'envoi de mail à l'adresse indiquée ${err}`,
                );
            }
        }),
    );
}

export async function sendJ1Email(users) {
    return module.exports.sendInfoToSecondaryEmailAfterXDays(1, users);
}

export async function sendJ30Email(users) {
    return module.exports.sendInfoToSecondaryEmailAfterXDays(30, users);
}

export async function deleteOVHEmailAcounts(
    optionalExpiredUsers?: memberBaseInfoSchemaType[],
) {
    let expiredUsers = optionalExpiredUsers;
    let dbUsers: memberBaseInfoSchemaType[] = [];
    if (!expiredUsers) {
        const users = (await getAllUsersInfo()).map((user) =>
            memberBaseInfoToModel(user),
        );
        const allOvhEmails = await BetaGouv.getAllEmailInfos();
        const today = new Date();
        const todayLess30days = new Date();
        todayLess30days.setDate(today.getDate() - 30);
        expiredUsers = users.filter((user) => {
            return (
                utils.checkUserIsExpired(user, 30) &&
                allOvhEmails.includes(user.username) &&
                user.primary_email_status_updated_at < todayLess30days &&
                user.primary_email_status === EmailStatusCode.EMAIL_SUSPENDED
            );
        });
    }
    for (const user of expiredUsers) {
        try {
            await BetaGouv.deleteEmail(user.username);
            await db
                .updateTable("users")
                .where("username", "=", user.username)
                .set({
                    primary_email_status: EmailStatusCode.EMAIL_DELETED,
                    primary_email: null,
                })
                .execute();
            await addEvent({
                action_code: EventCode.MEMBER_EMAIL_DELETED,
                created_by_username: SYSTEM_NAME,
                action_on_username: user.username,
            });

            console.log(`Suppression de l'email ovh pour ${user.username}`);
        } catch {
            console.log(
                `Erreur lors de la suppression de l'email ovh pour ${user.username}`,
            );
        }
    }
}

export async function deleteSecondaryEmailsForUsers(
    optionalExpiredUsers?: memberBaseInfoSchemaType[],
) {
    let expiredUsers = optionalExpiredUsers;
    if (!expiredUsers) {
        const users = (await getAllUsersInfo()).map((user) =>
            memberBaseInfoToModel(user),
        );
        expiredUsers = users.filter((user) =>
            utils.checkUserIsExpired(user, 30),
        );
    }
    const today = new Date();
    const todayLess30days = new Date();
    todayLess30days.setDate(today.getDate() - 30);
    const dbUsers = expiredUsers.filter(
        (user) =>
            user.secondary_email &&
            [
                EmailStatusCode.EMAIL_DELETED,
                EmailStatusCode.EMAIL_EXPIRED,
            ].includes(user.primary_email_status) &&
            user.primary_email_status_updated_at < todayLess30days,
    );
    for (const user of dbUsers) {
        try {
            await db
                .updateTable("users")
                .set({
                    secondary_email: null,
                })
                .where("username", "=", user.username)
                .execute();
            console.log(`Suppression de secondary_email pour ${user.username}`);
        } catch {
            console.log(
                `Erreur lors de la suppression de secondary_email pour ${user.username}`,
            );
        }
    }
}

export async function deleteMatomoAccount() {
    await deleteServiceAccounts(matomoClient);
}

export async function deleteSentryAccount() {
    await deleteServiceAccounts(sentryClient);
}

export async function deleteServiceAccounts(
    service: AccountService, // Accept any service that implements the AccountService interface
) {
    const allServiceUsers = await service.getAllUsers();
    // const allServiceUserEmails = allServiceUsers.map((user) => user.email);
    const today = new Date();
    const todayLess30days = new Date();
    todayLess30days.setDate(today.getDate() - 30);
    const expiredUsers = (await getAllExpiredUsers(todayLess30days)).map(
        (user) => memberBaseInfoToModel(user),
    );

    const expiredUsersWrappers = expiredUsers
        .map((expiredUsers) => ({
            dbUser: expiredUsers,
            serviceUser:
                allServiceUsers.find(
                    (serviceUser) =>
                        serviceUser.user.email === expiredUsers.primary_email,
                ) || null,
        }))
        .filter((expiredUser) => expiredUser.serviceUser);

    for (const user of expiredUsersWrappers) {
        try {
            if (user.serviceUser?.serviceUserId) {
                console.log(
                    `Suppression du compte ${service.name} pour ${user.dbUser.username}`,
                );
                await service.deleteUserByServiceId(
                    user.serviceUser.serviceUserId,
                );
                console.log(
                    `Compte ${service.name} supprimé pour ${user.dbUser.username}`,
                );
                await addEvent({
                    created_by_username: SYSTEM_NAME,
                    action_code: EventCode.MEMBER_SERVICE_ACCOUNT_DELETED,
                    action_metadata: {
                        email: user.serviceUser.user.email,
                        service: service.name,
                    },
                });
            }
        } catch (err) {
            console.error(
                `Erreur lors de la suppression du compte pour ${user.dbUser.username} : ${err}`,
            );
        }
    }
}

export async function deleteRedirectionsAfterQuitting(
    check_all = false,
): Promise<unknown[]> {
    const users = (await getAllUsersInfo()).map((user) =>
        memberBaseInfoToModel(user),
    );
    const expiredUsers = check_all
        ? utils.getExpiredUsers(users, 1)
        : utils.getExpiredUsersForXDays(users, 1);

    return Promise.all(
        expiredUsers.map(async (user) => {
            try {
                const redirections = await BetaGouv.redirectionsForId({
                    from: user.username,
                });

                console.log(
                    `Suppression des redirections pour ${user.fullname}`,
                );

                redirections.map(
                    async (r: OvhRedirection) =>
                        await BetaGouv.deleteRedirection(
                            utils.buildBetaEmail(user.username),
                            r.to,
                        ),
                );
            } catch (err) {
                console.log(
                    `Impossible de modifier les redirections pour ${user.fullname}: ${err}`,
                );
            }
        }),
    );
}
const removeEmailFromMailingList = async (
    userId: string,
    mailingList: string[],
) => {
    return Promise.all(
        mailingList.map(async (mailing: string) => {
            try {
                await BetaGouv.unsubscribeFromMailingList(
                    mailing,
                    utils.buildBetaEmail(userId),
                );
                console.log(
                    `Suppression de ${utils.buildBetaEmail(
                        userId,
                    )} de la mailing list ${mailing}`,
                );
            } catch (err) {
                console.error(
                    `Erreur lors de la suppression de l'email ${utils.buildBetaEmail(
                        userId,
                    )} de la mailing list ${mailing}  : ${err}`,
                );
            }
        }),
    );
};

export async function removeEmailsFromMailingList(
    optionalExpiredUsers?: memberBaseInfoSchemaType[],
    nbDays = 30,
) {
    let expiredUsers = optionalExpiredUsers;
    if (!expiredUsers) {
        const users = (await getAllUsersInfo()).map((user) =>
            memberBaseInfoToModel(user),
        );
        expiredUsers = utils.getExpiredUsersForXDays(users, nbDays);
    }
    const mailingList: string[] = (await BetaGouv.getAllMailingList()) || [];
    for (const user of expiredUsers) {
        try {
            await removeEmailFromMailingList(user.username, mailingList);
        } catch (e) {
            console.error(e);
        }
    }
    for (const user of expiredUsers) {
        try {
            await removeContactsFromMailingList({
                emails: [user.primary_email, user.secondary_email].filter(
                    (str) => str,
                ) as string[],
                listType: MAILING_LIST_TYPE.NEWSLETTER,
            });
        } catch (e) {
            console.error(e);
        }
        try {
            await removeContactsFromMailingList({
                emails: [user.primary_email, user.secondary_email].filter(
                    (str) => str,
                ) as string[],
                listType: MAILING_LIST_TYPE.ONBOARDING,
            });
        } catch (e) {
            console.error(e);
        }
    }
}
