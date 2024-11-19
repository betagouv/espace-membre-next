import { config } from "dotenv";

import { MemberType } from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";

config();
const isSecure = (process.env.SECURE || "true") === "true";
const APP_TYPE = process.env.APP_TYPE || "app";
const getOrThrowError = (key: string): string => {
    if (process.env[key] && typeof process.env[key] === "string") {
        return process.env[key] as string;
    }
    throw new Error(`Environement variable ${key} is required`);
};

const userStatusOptions = [
    { name: "Indépendant", key: "independent" },
    {
        name: "Agent Public (fonctionnaire ou sous contrat stage, alternance, CDD ou CDI avec une structure publique)",
        key: "admin",
    },
    { name: "Société de service", key: "service" },
];

const memberTypeOptions = [
    { name: `Membre d'une startup ou d'un incubateur`, key: MemberType.BETA },
    {
        name: "Responsable de compte chez un attributaire",
        key: MemberType.ATTRIBUTAIRE,
    },
    {
        name: `Membre d'un autre service DINUM (etalab, ...)`,
        key: MemberType.DINUM,
    },
    { name: `Autre`, key: MemberType.OTHER },
];

const userBadgeOptions = [{ name: "Ségur (Paris)", key: "segur" }];

const CRON_TASK_ENV_VAR = {
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    AIRTABLE_FORMATION_BASE_ID: process.env.AIRTABLE_FORMATION_BASE_ID,
    FEATURE_MATTERMOST_REMOVE_USERS:
        process.env.FEATURE_MATTERMOST_REMOVE_USERS === "true",
    featureCreateUserOnMattermost:
        process.env.FEATURE_CREATE_USER_ON_MATTERMOST === "true",
    featureAddUserToCommunityTeam:
        process.env.FEATURE_ADD_USER_TO_COMMUNITY_ON_MATTERMOST === "true",
    featureReactiveMattermostUsers:
        process.env.FEATURE_REACTIVE_MATTERMOST_USERS === "true",
    featureRemoveExpiredUsersFromCommunityOnMattermost:
        process.env
            .FEATURE_REMOVED_EXPIRED_USERS_FROM_COMMUNITY_ON_MATTERMOST ===
        "true",
    featureAddExpiredUsersToAlumniOnMattermost:
        process.env.FEATURE_ADD_EXPIRED_USERS_TO_ALUMNI_ON_MATTERMOST ===
        "true",
    CALENDAR_CRON_TIME: process.env.CALENDAR_CRON_TIME,
    CALENDAR_URL: process.env.CALENDAR_URL,
    CALENDAR_PUBLIC_URL: process.env.CALENDAR_PUBLIC_URL,
    CALENDAR_GIP_URL: process.env.CALENDAR_GIP_URL,
    CALENDAR_GIP_PUBLIC_URL: process.env.CALENDAR_GIP_PUBLIC_URL,
    FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE:
        process.env.FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE === "true",
    FEATURE_NEWSLETTER: process.env.FEATURE_NEWSLETTER === "true",
    FEATURE_SYNC_BETAGOUV_USER_API:
        process.env.FEATURE_SYNC_BETAGOUV_USER_API === "true",
    featureSubscribeToIncubateurMailingList:
        process.env.FEATURE_SUBSCRIBE_TO_INCUBATEUR_MAILING_LIST === "true",
    featureUnsubscribeFromIncubateurMailingList:
        process.env.FEATURE_UNSUBSCRIBE_FROM_INCUBATEUR_MAILING_LIST === "true",
    featureAddGithubUserToOrganization:
        process.env.FEATURE_ADD_GITHUB_USER_TO_ORGANIZATION === "true",
    featureRemoveGithubUserFromOrganization:
        process.env.FEATURE_REMOVE_GITHUB_USER_FROM_ORGANIZATION === "true",
    featureDeleteRedirectionsAfterQuitting:
        process.env.FEATURE_DELETE_REDIRECTIONS_AFTER_QUITTING === "true",
    featureSendJ1Email: process.env.FEATURE_SEND_J1_EMAIL === "true",
    featureSendJ30Email: process.env.FEATURE_SEND_J30_EMAIL === "true",
    featureDeleteSecondaryEmail:
        process.env.FEATURE_DELETE_SECONDARY_EMAIL === "true",
    featureDeleteOVHEmailAccounts:
        process.env.FEATURE_DELETE_OVH_EMAIL_ACCOUNTS === "true",
    featureSetEmailExpired: process.env.FEATURE_SET_EMAIL_EXPIRED === "true",
    featureRemoveEmailsFromMailingList:
        process.env.FEATURE_REMOVE_EMAILS_FROM_MAILING_LIST === "true",
    featureReinitPasswordEmail:
        process.env.FEATURE_REINIT_PASSWORD_EMAIL === "true",
    featureOnUserContractEnd:
        process.env.FEATURE_ON_USER_CONTRACT_END === "true",
    featureRemindUserWithPendingPullRequestOnAuthorFile:
        process.env
            .FEATURE_REMIND_USER_WITH_PENDING_PULL_REQUEST_ON_AUTHOR_FILE ===
        "true",
    FEATURE_REMINDER_TEAM_IF_PENDING_PR_ON_AUTHOR_FILE:
        process.env.FEATURE_REMINDER_TEAM_IF_PENDING_PR_ON_AUTHOR_FILE ===
        "true",
    featureSendMessageToActiveUsersWithoutSecondaryEmail:
        process.env
            .FEATURE_SEND_MESSAGE_TO_ACTIVE_USERS_WITHOUT_SECONDARY_EMAIL ===
        "true",
    FEATURE_DELETE_MATOMO_ACCOUNT: process.env.FEATURE_DELETE_MATOMO_ACCOUNT,
    FEATURE_DELETE_SENTRY_ACCOUNT: process.env.FEATURE_DELETE_SENTRY_ACCOUNT,
    FEATURE_SEND_NEWSLETTER: process.env.FEATURE_SEND_NEWSLETTER === "true",
    visitSenderEmail:
        process.env.VISIT_MAIL_SENDER || "secretariat@beta.gouv.fr",
    visitRecipientEmail:
        process.env.VISIT_MAIL_RECIPIENT || "espace-membre@incubateur.net",
    githubBetagouvTeam: process.env.GITHUB_BETAGOUV_TEAM || "beta-gouv-fr",
    NEWSLETTER_BOT_ICON_URL: process.env.NEWSLETTER_BOT_ICON_URL,
    newsletterSendTime: process.env.NEWSLETTER_SEND_TIME,
    newsletterHashSecret: process.env.NEWSLETTER_HASH_SECRET,
    newsletterSentDay: process.env.NEWSLETTER_SENT_DAY || "THURSDAY",
    newsletterTemplateId: process.env.NEWSLETTER_TEMPLATE_ID,
    padURL: process.env.PAD_URL || "https://pad.incubateur.net",
    padEmail: process.env.PAD_USERNAME,
    padPassword: process.env.PAD_PASSWORD,
    MATOMO_TOKEN: process.env.MATOMO_TOKEN,
    MATOMO_API_URL: process.env.MATOMO_API_URL,
    SENTRY_API_URL: process.env.SENTRY_API_URL,
    SENTRY_TOKEN: process.env.SENTRY_TOKEN,
    SENTRY_ORGANIZATION: process.env.SENTRY_ORGANIZATION,
};

const REQUIRED_APP_KEY = ["SESSION_SECRET", "REDIS_URL"];
if (APP_TYPE === "app") {
    REQUIRED_APP_KEY.forEach((key) => {
        getOrThrowError(key);
    });
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    ...CRON_TASK_ENV_VAR,
    AUTH_URL: process.env.AUTH_URL,
    OVH_APP_KEY: process.env.OVH_APP_KEY,
    OVH_APP_SECRET: process.env.OVH_APP_SECRET,
    OVH_CONSUMER_KEY: process.env.OVH_CONSUMER_KEY,
    secret: process.env.SESSION_SECRET!,
    SESSION_COOKIE_NAME: "espaceMembreCookieName",
    secure: isSecure,
    protocol: isSecure ? "https" : "http",
    host: process.env.HOSTNAME,
    port: parseInt(process.env.PORT || "3000", 10),
    CHATWOOT_ID: process.env.CHATWOOT_ID,
    CHATWOOT_IGNORE_EMAILS: (process.env.CHATWOOT_IGNORE_EMAILS || "").split(
        ""
    ),
    CHATWOOT_BADGE_ID: process.env.CHATWOOT_BADGE_ID,
    domain: process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr",
    DS_TOKEN: process.env.DS_TOKEN,
    DS_DEMARCHE_NUMBER: process.env.DS_DEMARCHE_NUMBER
        ? parseInt(process.env.DS_DEMARCHE_NUMBER)
        : null,
    DS_DEMARCHE_RENEWAL_BADGE_NUMBER: process.env
        .DS_DEMARCHE_RENEWAL_BADGE_NUMBER
        ? parseInt(process.env.DS_DEMARCHE_RENEWAL_BADGE_NUMBER)
        : null,
    EMAIL_DEFAULT_PLAN:
        process.env.EMAIL_DEFAULT_PLAN || EMAIL_PLAN_TYPE.EMAIL_PLAN_BASIC,
    user: {
        statusOptions: userStatusOptions,
        minStartDate: "2013-07-01",
        badgeOptions: userBadgeOptions,
        memberOptions: memberTypeOptions,
    },
    newsletterBroadcastList:
        process.env.NEWSLETTER_BROADCAST_LIST || "secretariat@beta.gouv.fr",
    mattermostURL:
        process.env.MATTERMOST_URL || "https://mattermost.incubateur.net",
    senderEmail: process.env.MAIL_SENDER || "espace-membre@incubateur.net",
    CHAT_WEBHOOK_URL_SECRETARIAT: getOrThrowError(
        "CHAT_WEBHOOK_URL_SECRETARIAT"
    ),
    CHAT_WEBHOOK_URL_GENERAL: getOrThrowError("CHAT_WEBHOOK_URL_GENERAL"),
    CHAT_WEBHOOK_URL_DINUM: getOrThrowError("CHAT_WEBHOOK_URL_DINUM"),
    CHAT_WEBHOOK_URL_GIP: getOrThrowError("CHAT_WEBHOOK_URL_GIP"),
    CHATWOOT_WEBSITE_TOKEN: process.env.CHATWOOT_WEBSITE_TOKEN,
    SPONSOR_API:
        process.env.SPONSOR_API ||
        "https://beta.gouv.fr/api/v2.6/sponsors.json",
    usersAPI:
        process.env.USERS_API || "https://beta.gouv.fr/api/v2.6/authors.json",
    incubatorAPI:
        process.env.INCUBATOR_API ||
        "https://beta.gouv.fr/api/v2.6/incubators.json",
    startupsAPI:
        process.env.STARTUPS_API ||
        "https://beta.gouv.fr/api/v2.6/startups.json",
    startupsDetailsAPI:
        process.env.STARTUPS_DETAILS_API ||
        "https://beta.gouv.fr/api/v2.6/startups_details.json",
    githubToken: process.env.GITHUB_TOKEN,
    githubOrganizationName: process.env.GITHUB_ORGANIZATION_NAME || "betagouv",
    githubOrgAdminToken: process.env.GITHUB_ORG_ADMIN_TOKEN,
    githubRepository: process.env.GITHUB_REPOSITORY || "beta.gouv.fr",
    githubFork: getOrThrowError("GITHUB_FORK"),
    defaultLoggedInRedirectUrl: "/account",
    sentryDSN: process.env.SENTRY_DSN || false,
    ESPACE_MEMBRE_ADMIN: process.env.ESPACE_MEMBRE_ADMIN
        ? process.env.ESPACE_MEMBRE_ADMIN.split(",")
        : [],
    MAILING_LIST_NEWSLETTER: parseInt(
        getOrThrowError("MAILING_LIST_NEWSLETTER")
    ),
    MAILING_LIST_ONBOARDING: process.env.MAILING_LIST_ONBOARDING
        ? parseInt(process.env.MAILING_LIST_ONBOARDING)
        : null,
    MAILING_LIST_REMINDER: process.env.MAILING_LIST_REMINDER
        ? parseInt(process.env.MAILING_LIST_REMINDER)
        : null,
    mattermostBotToken: process.env.MATTERMOST_BOT_TOKEN,
    mattermostTeamId: process.env.MATTERMOST_TEAM_ID || "testteam",
    mattermostAlumniTeamId:
        process.env.MATTERMOST_ALUMNI_TEAM_ID || "testalumniteam",
    mattermostInvitationLink: process.env.MATTERMOST_INVITATION_LINK || "",
    MATTERMOST_INVITE_ID: process.env.MATTERMOST_INVITE_ID,
    MATTERMOST_ALLOWED_DOMAINS:
        process.env.MATTERMOST_ALLOWED_DOMAINS || "beta.gouv.fr",
    MATTERMOST_PARTNERS_AUTHORS_URL:
        process.env.MATTERMOST_PARTNERS_AUTHORS_URL,
    MATTERMOST_PARTNERS_AUTHORS_URLS: process.env
        .MATTERMOST_PARTNERS_AUTHORS_URLS
        ? JSON.parse(process.env.MATTERMOST_PARTNERS_AUTHORS_URLS)
        : [],
    MATTERMOST_EMAIL_REGEX_EXCEPTION:
        process.env.MATTERMOST_EMAIL_REGEX_EXCEPTION,
    NEWSLETTER_NUMBER_OF_DAYS_WITH_LAST_NEWSLETTER: process.env
        .NEWSLETTER_NUMBER_OF_DAYS_WITH_LAST_NEWSLETTER
        ? parseInt(
              process.env.NEWSLETTER_NUMBER_OF_DAYS_WITH_LAST_NEWSLETTER,
              10
          )
        : 10,
    OVH_EMAIL_PRO_NAME: process.env.OVH_EMAIL_PRO_NAME,
    OVH_EMAIL_EXCHANGE_NAME: process.env.OVH_EMAIL_EXCHANGE_NAME,
    investigationReportsIframeURL:
        process.env.INVESTIGATION_REPORTS_IFRAME_URL || "",
    incubateurMailingListName:
        process.env.INCUBATEUR_MAILING_LIST_NAME || "incubateur",
    JOBS_API: process.env.JOBS_API || "https://beta.gouv.fr/api/v2.5/jobs.json",
    JOBS_WTTJ_API: process.env.JOBS_WTTJ_API,
    leavesEmail: process.env.LEAVES_EMAIL || "depart@beta.gouv.fr",
    // If both emails of the users are already in sib update will not work
    FEATURE_SIB_USE_UPDATE_CONTACT_EMAIL:
        process.env.FEATURE_SIB_USE_UPDATE_CONTACT_EMAIL === "true",
    FEATURE_USE_NEW_MARRAINAGE:
        process.env.FEATURE_USE_NEW_MARRAINAGE === "true",
    SIB_WEBHOOK_ID: process.env.SIB_WEBHOOK_ID,
    SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE,
    SIB_APIKEY_PUBLIC: process.env.SIB_APIKEY_TECH_PUBLIC,
    SIB_APIKEY_TECH_PRIVATE: process.env.SIB_APIKEY_TECH_PRIVATE!,
    SIB_APIKEY_TECH_PUBLIC: process.env.SIB_APIKEY_TECH_PUBLIC,
    tchap_api: process.env.TCHAP_API,
    HASH_SALT: process.env.HASH_SALT,
    PASSWORD_ENCRYPT_KEY: process.env.PASSWORD_ENCRYPT_KEY,
    PASSWORD_IV_KEY: process.env.PASSWORD_IV_KEY,
    REDIS_URL: process.env.REDIS_URL!,
    DS_BADGE_FORM_URL: process.env.NEXT_PUBLIC_DS_BADGE_FORM_URL,
    DS_BADGE_RENEWAL_FORM_URL:
        process.env.NEXT_PUBLIC_DS_BADGE_RENEWAL_FORM_URL,
    SUPPORT_EMAIL: process.env.NEXT_SUPPORT_EMAIL,
    S3_KEY_ID: process.env.S3_KEY_ID,
    S3_KEY_SECRET: process.env.S3_KEY_SECRET,
    S3_HOST: process.env.S3_HOST,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_GET_HOST: process.env.S3_GET_HOST,
    S3_REGION: process.env.S3_REGION,
};
