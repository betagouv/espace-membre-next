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
import { pullRequestStateMachine } from "./onboarding/pullRequestStateMachine";
import {
    pullRequestWatcher,
    pullRequestWatcherSendEmailToTeam,
} from "./pullRequestWatcher";
import { recreateEmailIfUserActive } from "./recreateEmailIfUserActive";
import { createMailingListForStartups } from "./startups/createMailingListForStartups";
import { sendEmailToStartupToUpdatePhase } from "./startups/sendEmailToStartupToUpdatePhase";
import {
    buildCommunityBDD,
    syncBetagouvStartupAPI,
    syncBetagouvUserAPI,
} from "./syncBetagouvAPIScheduler";
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
} from "./userContractEndingScheduler";
import config from "@/server/config";
import db from "@db";
import { setEmailExpired } from "@schedulers/setEmailExpired";

interface Job {
    cronTime: string;
    onTick: (any) => void;
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
    },
    {
        cronTime: "0 0 14 * * 1",
        onTick: () => sendReminderToUserAtDays({ nbDays: 90 }),
        isActive: true,
        name: "sendReminderToUserAtDays",
    },
    {
        cronTime: "0 0 5 * * 1",
        onTick: () => sendReminderToUserAtDays({ nbDays: 30 }),
        isActive: !!config.FEATURE_MATTERMOST_REMOVE_USERS,
        name: "sendReminderToUserAtDays",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: () => {
            sendGroupDeSoutienReminder("general", 1, 0);
        },
        isActive: true,
        name: "sendGroupDeSoutienReminder",
    },
    {
        cronTime: "0 */8 * * * *",
        onTick: createUsersByEmail,
        isActive: !!config.featureCreateUserOnMattermost,
        name: "createUsersByEmail",
        description: "Cron job to create user on mattermost by email",
    },
    {
        cronTime: "0 */8 * * * *",
        onTick: addUsersNotInCommunityToCommunityTeam,
        isActive: !!config.featureAddUserToCommunityTeam,
        name: "addUsersNotInCommunityToCommunityTeam",
        description:
            "Cron job to add user existing on mattermost to community team if there not in",
    },
    {
        cronTime: "0 0 8 1 * *",
        onTick: reactivateUsers,
        isActive: !!config.featureReactiveMattermostUsers,
        name: "reactivateUsers",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: removeUsersFromCommunityTeam,
        isActive: !!config.featureRemoveExpiredUsersFromCommunityOnMattermost,
        name: "removeUsersFromCommunityTeam",
        description: "Cron job to remove user from community on mattermost",
    },
    {
        cronTime: "0 10 10 * * *",
        onTick: moveUsersToAlumniTeam,
        isActive: !!config.featureAddExpiredUsersToAlumniOnMattermost,
        name: "moveUsersToAlumniTeam",
        description: "Cron job to add user to alumni on mattermost",
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
    },
    {
        cronTime: "30 09 01 Jan,Apr,Jul,Oct *",
        onTick: sendEmailToStartupToUpdatePhase,
        isActive: config.FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE,
        name: "sendEmailToStartupToUpdatePhase",
    },
];

const formationJobs: Job[] = [
    {
        cronTime: "0 0 * * *",
        onTick: () => syncFormationFromAirtable(true),
        isActive: true,
        name: "SyncFormationFromAirtable",
    },
    {
        cronTime: "0 0 * * *",
        onTick: () => syncFormationInscriptionFromAirtable(true),
        isActive: true,
        name: "SyncFormationInscriptionFromAirtable",
    },
];

const metricJobs: Job[] = [
    {
        cronTime: "0 10 1 * *", // every 1srt of each month,
        onTick: buildCommunityBDD,
        isActive: true,
        name: "buildCommunityBDD",
    },
];

const pullRequestJobs: Job[] = [
    {
        cronTime: "0 */4 * * * *",
        onTick: pullRequestStateMachine,
        isActive: true,
        name: "pullRequestStateMachine",
    },
];

const newsletterJobs = [
    {
        cronTime: process.env.NEWSLETTER_FIRST_REMINDER_TIME || "0 0 10 * * 1", // every week a 8:00 on monday
        onTick: () => newsletterReminder("FIRST_REMINDER"),
        isActive: config.FEATURE_NEWSLETTER,
        name: "newsletterMondayReminderJob",
    },
    {
        cronTime: "0 0 8 * * 4",
        onTick: () => newsletterReminder("SECOND_REMINDER"),
        isActive: config.FEATURE_NEWSLETTER,
        name: "newsletterThursdayMorningReminderJob",
    },
    {
        cronTime: "0 0 14 * * 4", // every week a 14:00 on thursday
        onTick: () => newsletterReminder("THIRD_REMINDER"),
        isActive: config.FEATURE_NEWSLETTER,
        name: "newsletterThursdayEveningReminderJob",
    },
    {
        cronTime: config.newsletterSendTime || "0 16 * * 4", // run on thursday et 4pm,
        onTick: sendNewsletterAndCreateNewOne,
        isActive: config.FEATURE_NEWSLETTER,
        name: "sendNewsletterAndCreateNewOneJob",
    },
];

const synchronizationJobs = [
    {
        cronTime: "0 10 * * *", // every day at 10,
        onTick: syncBetagouvUserAPI,
        start: true,
        timeZone: "Europe/Paris",
        isActive: !!config.FEATURE_SYNC_BETAGOUV_USER_API,
        name: "syncBetagouvUserAPI",
        description: "Synchronize user info from beta.gouv.fr api with bdd",
    },
    {
        cronTime: "5 10 * * *", // every day at 10,
        onTick: syncBetagouvStartupAPI,
        start: true,
        timeZone: "Europe/Paris",
        isActive: true,
        name: "syncBetagouvStartupAPI",
        description: "Synchronize startup info from beta.gouv.fr api with bdd",
    },
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

const jobs: Job[] = [
    ...newsletterJobs,
    ...mattermostJobs,
    ...startupJobs,
    ...metricJobs,
    ...pullRequestJobs,
    ...synchronizationJobs,
    ...formationJobs,
    {
        cronTime: "0 0 0 * * 1", // every week a 0:00 on monday
        onTick: unblockEmailsThatAreActive,
        isActive: true,
        name: "Unblock blacklisted email",
    },
    {
        cronTime: "0 */8 * * * *",
        onTick: recreateEmailIfUserActive,
        isActive: false,
        name: "recreateEmailIfUserActive",
        description: "Recreate email for user active again",
    },
    {
        cronTime: "0 */8 * * * *",
        onTick: setEmailAddressesActive,
        isActive: true,
        name: "setEmailAddressesActive",
    },
    {
        cronTime: "0 */8 * * * *",
        onTick: sendOnboardingVerificationPendingEmail,
        isActive: true,
        name: "sendOnboardingVerificationPendingEmail",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: createEmailAddresses,
        isActive: true,
        name: "emailCreationJob",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: createRedirectionEmailAdresses,
        isActive: true,
        name: "cron de creation de redirection",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: setCreatedEmailRedirectionsActive,
        isActive: true,
        name: "setEmailRedirectionActive",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: subscribeEmailAddresses,
        isActive: !!config.featureSubscribeToIncubateurMailingList,
        name: "subscribeEmailAddresses",
    },
    {
        cronTime: "0 */4 * * * *",
        onTick: unsubscribeEmailAddresses,
        isActive: !!config.featureUnsubscribeFromIncubateurMailingList,
        name: "unsubscribeEmailAddresses",
    },
    {
        cronTime: "0 */5 * * * 1-5",
        onTick: addGithubUserToOrganization,
        isActive: !!config.featureAddGithubUserToOrganization,
        name: "addGithubUserToOrganization",
    },
    {
        cronTime: "0 0 18 * * *",
        onTick: removeGithubUserFromOrganization,
        isActive: !!config.featureRemoveGithubUserFromOrganization,
        name: "removeGithubUserFromOrganization",
    },
    {
        cronTime: "0 0 8,14 * * *",
        onTick: deleteRedirectionsAfterQuitting,
        isActive: !!config.featureDeleteRedirectionsAfterQuitting,
        name: "deleteRedirectionsAfterQuitting",
    },
    {
        cronTime: "0 0 8 * * *",
        onTick: sendJ1Email,
        isActive: !!config.featureSendJ1Email,
        name: "sendJ1Email",
    },
    {
        cronTime: "0 0 8 * * *",
        onTick: sendJ30Email,
        isActive: !!config.featureSendJ30Email,
        name: "sendJ30Email",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: deleteSecondaryEmailsForUsers,
        isActive: !!config.featureDeleteSecondaryEmail,
        name: "deleteSecondaryEmailsForUsers",
        description: "Cron job to delete secondary email",
    },
    {
        cronTime: "0 0 15 * * *",
        onTick: deleteOVHEmailAcounts,
        isActive: !!config.featureDeleteOVHEmailAccounts,
        name: "deleteOVHEmailAcounts",
    },
    {
        cronTime: "0 0 15 * * *",
        onTick: setEmailExpired,
        isActive: !!config.featureSetEmailExpired,
        name: "setEmailExpired",
    },
    {
        cronTime: "0 0 8 * * *",
        onTick: removeEmailsFromMailingList,
        isActive: !!config.featureRemoveEmailsFromMailingList,
        name: "removeEmailsFromMailingList",
    },
    {
        cronTime: "0 0 14 * * *",
        onTick: reinitPasswordEmail,
        isActive: !!config.featureReinitPasswordEmail,
        name: "reinitPasswordEmail",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: () => sendContractEndingMessageToUsers("mail15days", true),
        isActive: !!config.featureOnUserContractEnd,
        name: "sendContractEndingMessageToUsers15days",
        description:
            "Create cron job for sending contract ending message to users",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: () => sendContractEndingMessageToUsers("mail30days", true),
        isActive: !!config.featureOnUserContractEnd,
        name: "sendContractEndingMessageToUsers30days",
        description:
            "Create cron job for sending contract ending message to users",
    },
    {
        cronTime: "0 0 10 * * *",
        onTick: () => sendContractEndingMessageToUsers("mail2days", false),
        isActive: !!config.featureOnUserContractEnd,
        name: "sendContractEndingMessageToUsers2days",
        description:
            "Create cron job for sending contract ending message to users",
    },
    {
        cronTime: "0 * * * *", // every hours at minute 0,
        onTick: pullRequestWatcher,
        isActive: !!config.featureRemindUserWithPendingPullRequestOnAuthorFile,
        name: "pullRequestWatcher",
        description:
            "Cron job to remind user with pending pull request on author file",
    },
    {
        cronTime: "0 * * * *", // every hours at minute 0,
        onTick: pullRequestWatcherSendEmailToTeam,
        isActive: !!config.FEATURE_REMINDER_TEAM_IF_PENDING_PR_ON_AUTHOR_FILE,
        name: "pullRequestWatcherSendEmailToTeam",
        description:
            "Cron job to remind user with pending pull request on author file",
    },
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

let activeJobs = 0;
for (const job of jobs) {
    const cronjob: Job = { timeZone: "Europe/Paris", start: true, ...job };

    if (cronjob.isActive) {
        console.log(`🚀 The job "${cronjob.name}" is ON ${cronjob.cronTime}`);
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
                    await db("tasks")
                        .insert(dbTaskSucceed)
                        .onConflict("name")
                        .merge();
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
                    await db("tasks")
                        .insert(dbTaskFailed)
                        .onConflict("name")
                        .merge();
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
