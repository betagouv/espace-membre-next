import * as Sentry from "@sentry/node";
import { CronJob } from "cron";

import { postEventsOnMattermost } from "./calendarScheduler";
import {
    createEmailAddresses,
    reinitPasswordEmail,
    subscribeEmailAddresses,
    unsubscribeEmailAddresses,
    setEmailAddressesActive,
    setCreatedEmailRedirectionsActive,
    createRedirectionEmailAdresses,
    sendOnboardingVerificationPendingEmail,
} from "./emailScheduler";
import { syncFormationFromAirtable } from "./formationScheduler/syncFormationFromAirtable";
import { syncFormationInscriptionFromAirtable } from "./formationScheduler/syncFormationInscriptionFromAirtable";
import {
    addGithubUserToOrganization,
    removeGithubUserFromOrganization,
} from "./githubScheduler";
import {
    createUsersByEmail,
    moveUsersToAlumniTeam,
    reactivateUsers,
    removeUsersFromCommunityTeam,
    addUsersNotInCommunityToCommunityTeam,
    syncMattermostUserStatusWithMattermostMemberInfosTable,
    syncMattermostUserWithMattermostMemberInfosTable,
    sendGroupDeSoutienReminder,
} from "./mattermostScheduler";
import {
    removeBetaAndParnersUsersFromCommunityTeam,
    sendReminderToUserAtDays,
} from "./mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam";
import {
    newsletterReminder,
    sendNewsletterAndCreateNewOne,
} from "./newsletterScheduler";
import { recreateEmailIfUserActive } from "./recreateEmailIfUserActive";
import { syncMatomoAccounts } from "./serviceScheduler/syncMatomoAccounts";
import { syncSentryAccounts } from "./serviceScheduler/syncSentryAccounts";
import { createMailingListForStartups } from "./startups/createMailingListForStartups";
import { sendEmailToStartupToUpdatePhase } from "./startups/sendEmailToStartupToUpdatePhase";
import { unblockEmailsThatAreActive } from "./unblockEmailsThatAreActive";
import { sendMessageToActiveUsersWithoutSecondaryEmail } from "./updateProfileScheduler";
import {
    deleteSecondaryEmailsForUsers,
    sendContractEndingMessageToUsers,
    sendJ1Email,
    sendJ30Email,
    deleteOVHEmailAcounts,
    deleteRedirectionsAfterQuitting,
    removeEmailsFromMailingList,
    deleteServiceAccounts,
    deleteMatomoAccount,
    deleteSentryAccount,
} from "./userContractEndingScheduler";
import { matomoClient } from "../config/matomo.config";
import { sentryClient } from "../config/sentry.config";
import { startBossClientInstance } from "../queueing/client";
import { db } from "@/lib/kysely";
import config from "@/server/config";
import { setEmailExpired } from "@schedulers/setEmailExpired";

interface Job {
    cronTime: string;
    onTick: (any) => any;
    isActive: boolean;
    name: string;
    description?: string;
    timeZone?: string;
    start?: boolean;
}

interface DBTask {
    name: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
    last_completed: Date;
    last_failed: Date;
    error_message: string;
}

interface DBTaskInsertSucceed
    extends Omit<DBTask, "last_failed" | "error_message" | "created_at"> {}
interface DBTaskInsertFailed
    extends Omit<DBTask, "last_completed" | "created_at"> {}

const onTickWrapper = (
    name: string,
    onTick: Function,
    onComplete: Function,
    onError: Function
) => {
    console.log("Create ontick wrapper");
    return async function () {
        console.log(`Run ${name}`);
        try {
            await onTick();
            console.log(`Run  after on tick ${name}`);
            await onComplete();
            console.log(`Run  after on Complete ${name}`);
        } catch (e) {
            Sentry.captureException(e);
            await onError(e);
            // Job Failed unexpectedly
        }
    };
};

const mattermostJobs: Job[] = [
    {
        cronTime: "0 0 14 * * *",
        onTick: removeBetaAndParnersUsersFromCommunityTeam,
        isActive: true,
        name: "removeBetaAndParnersUsersFromCommunityTeam",
        description: "Move expired user to mattermost alumni",
    },
    {
        cronTime: "0 0 14 * * 1",
        onTick: () => sendReminderToUserAtDays({ nbDays: 90 }),
        isActive: true,
        name: "sendReminderToUserAtDays",
        description: "Send mattermost message to expired users (90 days)",
    },
    {
        cronTime: "0 0 5 * * 1",
        onTick: () => sendReminderToUserAtDays({ nbDays: 30 }),
        isActive: !!config.FEATURE_MATTERMOST_REMOVE_USERS,
        name: "sendReminderToUserAtDays",
        description: "Send mattermost message to expired users (30 days)",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: () => {
            sendGroupDeSoutienReminder("general", 1, 0);
        },
        isActive: true,
        name: "sendGroupDeSoutienReminder",
        description: "Send mattermost message groupe de soutien",
    },
    {
        cronTime: "0 */8 * * * *",
        onTick: createUsersByEmail,
        isActive: !!config.featureCreateUserOnMattermost,
        name: "createUsersByEmail",
        description:
            "Create missing mattermost users and send invitation email",
    },
    {
        cronTime: "0 */8 * * * *",
        onTick: addUsersNotInCommunityToCommunityTeam,
        isActive: !!config.featureAddUserToCommunityTeam,
        name: "addUsersNotInCommunityToCommunityTeam",
        description: "Add existing users to community team if there not in",
    },
    {
        cronTime: "0 0 8 1 * *",
        onTick: reactivateUsers,
        isActive: !!config.featureReactiveMattermostUsers,
        name: "reactivateUsers",
        description: "Reactivate mattermost accounts if any",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: removeUsersFromCommunityTeam,
        isActive: !!config.featureRemoveExpiredUsersFromCommunityOnMattermost,
        name: "removeUsersFromCommunityTeam",
        description:
            "Remove expired users from mattermost community team (90 days)",
    },
    {
        cronTime: "0 10 10 * * *",
        onTick: moveUsersToAlumniTeam,
        isActive: !!config.featureAddExpiredUsersToAlumniOnMattermost,
        name: "moveUsersToAlumniTeam",
        description: "Add user to mattermost alumni team",
    },
    // Post automatic
    {
        cronTime: config.CALENDAR_CRON_TIME || "0 30 17 * * 1", // every week a 10 on monday
        onTick: () =>
            postEventsOnMattermost({
                numberOfDays: 6,
                canal: "general",
                calendarURL: config.CALENDAR_URL!,
                calendarPublicUrl: config.CALENDAR_PUBLIC_URL!,
                chatWebhook: config.CHAT_WEBHOOK_URL_GENERAL,
            }),
        timeZone: "Europe/Paris",
        isActive: true,
        name: "PostEventsFromBetaOnMattermost",
        description: "Post event of the week from betagouv calendar",
    },
    {
        cronTime: "0 0 8 * * 1", // every week a 8:00 on monday
        onTick: () =>
            postEventsOnMattermost({
                numberOfDays: 6,
                calendarURL: config.CALENDAR_GIP_URL!,
                calendarPublicUrl: config.CALENDAR_GIP_PUBLIC_URL!,
                chatWebhook: config.CHAT_WEBHOOK_URL_GIP,
            }),
        timeZone: "Europe/Paris",
        isActive: true,
        name: "Post event of the week from gip calendar",
    },
];

const startupJobs: Job[] = [
    {
        cronTime: "0 0 5 * * 1",
        onTick: createMailingListForStartups,
        isActive: true,
        name: "createMailingListForStartups",
        description: "Créé des mailings-list OVH pour les startups",
    },
    {
        cronTime: "30 09 01 Jan,Apr,Jul,Oct *",
        onTick: sendEmailToStartupToUpdatePhase,
        isActive: config.FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE,
        name: "sendEmailToStartupToUpdatePhase",
        description:
            "Envoie par mail une relance pour mise à jour de la phase de la SE",
    },
];

const servicesJobs: Job[] = [
    {
        cronTime: "0 15 19 * * *",
        onTick: deleteMatomoAccount,
        isActive: !!config.FEATURE_DELETE_MATOMO_ACCOUNT,
        name: "deleteMatomoAccount",
        description:
            "Supprime les comptes matomos des membres expirés (30 days)",
    },
    {
        cronTime: "0 45 15 * * *",
        onTick: deleteSentryAccount,
        isActive: !!config.FEATURE_DELETE_SENTRY_ACCOUNT,
        name: "deleteSentryAccount",
        description:
            "Supprime les comptes sentry des membres expirés (30 days)",
    },
    {
        cronTime: process.env.SYNC_MATOMO_ACCOUNT_CRON || "0 30 14 * * *",
        onTick: () => syncMatomoAccounts(matomoClient),
        isActive: true,
        name: "syncMatomoAccounts",
        description: "Sync les comptes matomo des membres actifs",
    },
    {
        cronTime: process.env.SYNC_SENTRY_ACCOUNT_CRON || "0 30 14 * * *",
        onTick: () => syncSentryAccounts(sentryClient),
        isActive: true,
        name: "syncSentryAccounts",
        description: "Sync les comptes sentry des membres actifs",
    },
];

const formationJobs: Job[] = [
    {
        cronTime: "0 0 * * *",
        onTick: () => syncFormationFromAirtable(true),
        isActive: true,
        name: "SyncFormationFromAirtable",
        description:
            "Synchronise les données AirTable des formations avec la DB",
    },
    {
        cronTime: "0 0 * * *",
        onTick: () => syncFormationInscriptionFromAirtable(true),
        isActive: true,
        name: "SyncFormationInscriptionFromAirtable",
        description:
            "Synchronise les données AirTable des inscriptions aux formations avec la DB",
    },
];

const newsletterJobs = [
    {
        cronTime: process.env.NEWSLETTER_FIRST_REMINDER_TIME || "0 0 10 * * 3", // every week a 8:00 on monday
        onTick: () => newsletterReminder("FIRST_REMINDER"),
        isActive: config.FEATURE_NEWSLETTER,
        name: "newsletterFirstReminderJob",
        description: "Rappel mattermost newsletter 1",
    },
    {
        cronTime: process.env.NEWSLETTER_SECOND_REMINDER_TIME || "0 0 8 * * 2",
        onTick: () => newsletterReminder("SECOND_REMINDER"),
        isActive: config.FEATURE_NEWSLETTER,
        name: "newsletterSecondReminderJob",
        description: "Rappel mattermost newsletter 2",
    },
    // {
    //     cronTime: "0 0 14 * * 4", // every week a 14:00 on thursday
    //     onTick: () => newsletterReminder("THIRD_REMINDER"),
    //     isActive: config.FEATURE_NEWSLETTER,
    //     name: "newsletterThursdayEveningReminderJob",
    //     description: "Rappel mattermost newsletter 3",
    // },
    {
        cronTime: config.newsletterSendTime || "0 16 * * 2", // run on thursday et 4pm,
        onTick: sendNewsletterAndCreateNewOne,
        isActive: config.FEATURE_NEWSLETTER,
        name: "sendNewsletterAndCreateNewOneJob",
        description:
            "Envoi de la newsletter et creation d'un nouveau PAD + message mattermost",
    },
];

const synchronizationJobs = [
    {
        cronTime: "0 10 10 * * *",
        onTick: syncMattermostUserWithMattermostMemberInfosTable,
        start: true,
        timeZone: "Europe/Paris",
        isActive: true,
        name: "syncMattermostUserWithMattermostMemberInfosTable",
        description: "Add new mattermost user to mattermost_member_info table",
    },
    {
        cronTime: "0 15 10 * * *",
        onTick: syncMattermostUserStatusWithMattermostMemberInfosTable,
        start: true,
        timeZone: "Europe/Paris",
        isActive: true,
        name: "syncMattermostUserStatusWithMattermostMemberInfosTable",
        description:
            "Get mattermost user activity info from api and sync with mattermost_member_info table",
    },
];

export const jobs: Job[] = [
    ...newsletterJobs,
    ...mattermostJobs,
    ...startupJobs,
    ...servicesJobs,
    // ...metricJobs,
    // ...pullRequestJobs,
    ...synchronizationJobs,
    ...formationJobs,
    {
        cronTime: "0 0 0 * * 1", // every week a 0:00 on monday
        onTick: unblockEmailsThatAreActive,
        isActive: true,
        name: "Unblock blacklisted email",
        description:
            "Unblock emails from MAILING_LIST_NEWSLETTER Brevo mailing-list",
    },
    {
        cronTime: "0 */8 * * * *",
        onTick: recreateEmailIfUserActive,
        isActive: true,
        name: "recreateEmailIfUserActive",
        description: "Recreate email for user active again",
    },
    {
        cronTime: "0 */8 * * * *",
        onTick: setEmailAddressesActive,
        isActive: true,
        name: "setEmailAddressesActive",
        description:
            "Add pending users to mailing-list and set email as active",
    },
    {
        cronTime: "0 */2 * * * *",
        onTick: sendOnboardingVerificationPendingEmail,
        isActive: true,
        name: "sendOnboardingVerificationPendingEmail",
        description:
            "Envoi d'un email de relance pour les adresses en attente de validation",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: createEmailAddresses,
        isActive: true,
        name: "emailCreationJob",
        description: "Créé les emails en attente sur OVH",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: createRedirectionEmailAdresses,
        isActive: true,
        name: "cron de creation de redirection",
        description: "Créé les redirections email en attente sur OVH",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: setCreatedEmailRedirectionsActive,
        isActive: true,
        name: "setEmailRedirectionActive",
        description:
            "Ajoute les nouvelles redirections aux mailing-lists brevo et active l'adresse",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: subscribeEmailAddresses,
        isActive: !!config.featureSubscribeToIncubateurMailingList,
        name: "subscribeEmailAddresses",
        description:
            "Re-inscrit les désabonnés à la mailing-list brevo incubateur",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: unsubscribeEmailAddresses,
        isActive: !!config.featureUnsubscribeFromIncubateurMailingList,
        name: "unsubscribeEmailAddresses",
        description: "Désinscrit les membres expirés de la mailing list",
    },
    {
        cronTime: "0 */5 * * * 1-5",
        onTick: addGithubUserToOrganization,
        isActive: !!config.featureAddGithubUserToOrganization,
        name: "addGithubUserToOrganization",
        description:
            "Envoi des invitations GitHub et ajout à la team GitHub/betagouv",
    },
    {
        cronTime: "0 0 18 * * *",
        onTick: removeGithubUserFromOrganization,
        isActive: !!config.featureRemoveGithubUserFromOrganization,
        name: "removeGithubUserFromOrganization",
        description: "Désinscrit les membres expirés de l'organisation GitHub",
    },
    {
        cronTime: "0 0 8,14 * * *",
        onTick: deleteRedirectionsAfterQuitting,
        isActive: !!config.featureDeleteRedirectionsAfterQuitting,
        name: "deleteRedirectionsAfterQuitting",
        description:
            "Supprime les redirections email OVH des utilisateurs expirés",
    },
    {
        cronTime: "0 0 8 * * *",
        onTick: sendJ1Email,
        isActive: !!config.featureSendJ1Email,
        name: "sendJ1Email",
        description: "Email départ J+1",
    },
    {
        cronTime: "0 0 8 * * *",
        onTick: sendJ30Email,
        isActive: !!config.featureSendJ30Email,
        name: "sendJ30Email",
        description: "Email départ J+30",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: deleteSecondaryEmailsForUsers,
        isActive: !!config.featureDeleteSecondaryEmail,
        name: "deleteSecondaryEmailsForUsers",
        description:
            "Supprime dans la DB les emails secondaires des membres expirés",
    },
    {
        cronTime: "0 0 15 * * *",
        onTick: deleteOVHEmailAcounts,
        isActive: !!config.featureDeleteOVHEmailAccounts,
        name: "deleteOVHEmailAcounts",
        description: "Supprime les emails OVH des membres expirés (30 days)",
    },
    {
        cronTime: "0 0 15 * * *",
        onTick: setEmailExpired,
        isActive: !!config.featureSetEmailExpired,
        name: "setEmailExpired",
        description: "Marque en DB les emails des membres comme expirés",
    },
    {
        cronTime: "0 0 8 * * *",
        onTick: removeEmailsFromMailingList,
        isActive: !!config.featureRemoveEmailsFromMailingList,
        name: "removeEmailsFromMailingList",
        description:
            "Supprime les utilisateurs expirés des mailing-lists brevo ONBOARDING,NEWSLETTER",
    },
    {
        cronTime: "0 0 14 * * *",
        onTick: reinitPasswordEmail,
        isActive: !!config.featureReinitPasswordEmail,
        name: "reinitPasswordEmail",
        description:
            "Réinitialise le mot de passe email des membres expirés après 5 jours",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: () => sendContractEndingMessageToUsers("mail15days", true),
        isActive: !!config.featureOnUserContractEnd,
        name: "sendContractEndingMessageToUsers15days",
        description: "Sending contract ending message to users (15 days)",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: () => sendContractEndingMessageToUsers("mail30days", true),
        isActive: !!config.featureOnUserContractEnd,
        name: "sendContractEndingMessageToUsers30days",
        description: "Sending contract ending message to users (30 days)",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: () => sendContractEndingMessageToUsers("mail2days", false),
        isActive: !!config.featureOnUserContractEnd,
        name: "sendContractEndingMessageToUsers2days",
        description: "Sending contract ending message to users (2 days)",
    },
    // {
    //     cronTime: "0 * * * *", // every hours at minute 0,
    //     onTick: pullRequestWatcher,
    //     isActive: !!config.featureRemindUserWithPendingPullRequestOnAuthorFile,
    //     name: "pullRequestWatcher",
    //     description:
    //         "Remind user with pending GitHub pull request on author file",
    // },
    // {
    //     cronTime: "0 * * * *", // every hours at minute 0,
    //     onTick: pullRequestWatcherSendEmailToTeam,
    //     isActive: !!config.FEATURE_REMINDER_TEAM_IF_PENDING_PR_ON_AUTHOR_FILE,
    //     name: "pullRequestWatcherSendEmailToTeam",
    //     description:
    //         "Remind team with pending GitHub pull request on author file",
    // },
    {
        cronTime: "0 10 1 * *", // every 1srt of each month,
        onTick: sendMessageToActiveUsersWithoutSecondaryEmail,
        start: true,
        timeZone: "Europe/Paris",
        isActive: !!config.featureSendMessageToActiveUsersWithoutSecondaryEmail,
        name: "sendMessageToActiveUsersWithoutSecondaryEmail",
        description:
            "Send message to active user without secondary email to update secondary email",
    },
];

function startJobs() {
    let activeJobs = 0;
    for (const job of jobs) {
        const cronjob: Job = { timeZone: "Europe/Paris", start: true, ...job };

        if (cronjob.isActive) {
            console.log(
                `🚀 The job "${cronjob.name}" is ON ${cronjob.cronTime}`
            );
            new CronJob({
                ...cronjob,
                onTick: onTickWrapper(
                    cronjob.name,
                    cronjob.onTick,
                    async function () {
                        const dbTaskSucceed: DBTaskInsertSucceed = {
                            name: cronjob.name,
                            description: cronjob.description,
                            updated_at: new Date(),
                            last_completed: new Date(),
                        };
                        await db
                            .insertInto("tasks")
                            .values(dbTaskSucceed)
                            .onConflict((eb) =>
                                eb.column("name").doUpdateSet({
                                    ...dbTaskSucceed,
                                })
                            )
                            .execute();
                        return;
                    },
                    async function (error) {
                        const dbTaskFailed: DBTaskInsertFailed = {
                            name: cronjob.name,
                            description: cronjob.description,
                            updated_at: new Date(),
                            last_failed: new Date(),
                            error_message: error.message,
                        };
                        await db
                            .insertInto("tasks")
                            .values(dbTaskFailed)
                            .onConflict((eb) =>
                                eb.column("name").doUpdateSet({
                                    ...dbTaskFailed,
                                })
                            )
                            .execute();
                        return;
                    }
                ),
            });
            activeJobs++;
        } else {
            console.log(`❌ The job "${cronjob.name}" is OFF`);
        }
    }

    console.log(`Started ${activeJobs} / ${jobs.length} cron jobs`);
}
startJobs();
startBossClientInstance();
