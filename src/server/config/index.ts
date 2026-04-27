import { getArrayFromEnv } from "@/lib/env";
import { MemberType } from "@/models/member";

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

const CRON_TASK_ENV_VAR = {
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_FORMATION_BASE_ID: process.env.AIRTABLE_FORMATION_BASE_ID,
  CALENDAR_CRON_TIME: process.env.CALENDAR_CRON_TIME,
  CALENDAR_URL: process.env.CALENDAR_URL,
  CALENDAR_PUBLIC_URL: process.env.CALENDAR_PUBLIC_URL,
  CALENDAR_GIP_URL: process.env.CALENDAR_GIP_URL,
  CALENDAR_GIP_PUBLIC_URL: process.env.CALENDAR_GIP_PUBLIC_URL,
  FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE:
    process.env.FEATURE_SEND_EMAIL_TO_STARTUP_TO_UPDATE_PHASE === "true",
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
  featureSetEmailExpired: process.env.FEATURE_SET_EMAIL_EXPIRED === "true",
  featureRemoveEmailsFromMailingList:
    process.env.FEATURE_REMOVE_EMAILS_FROM_MAILING_LIST === "true",
  featureReinitPasswordEmail:
    process.env.FEATURE_REINIT_PASSWORD_EMAIL === "true",
  featureOnUserContractEnd: process.env.FEATURE_ON_USER_CONTRACT_END === "true",
  featureRemindUserWithPendingPullRequestOnAuthorFile:
    process.env.FEATURE_REMIND_USER_WITH_PENDING_PULL_REQUEST_ON_AUTHOR_FILE ===
    "true",
  featureSendMessageToActiveUsersWithoutSecondaryEmail:
    process.env.FEATURE_SEND_MESSAGE_TO_ACTIVE_USERS_WITHOUT_SECONDARY_EMAIL ===
    "true",
  FEATURE_DELETE_MATOMO_ACCOUNT: process.env.FEATURE_DELETE_MATOMO_ACCOUNT,
  FEATURE_DELETE_SENTRY_ACCOUNT: process.env.FEATURE_DELETE_SENTRY_ACCOUNT,
  FEATURE_NEWSLETTER: process.env.FEATURE_NEWSLETTER === "true",
  NEWSLETTER_BOT_ICON_URL: process.env.NEWSLETTER_BOT_ICON_URL,
  newsletterContentUrl:
    process.env.NEWSLETTER_CONTENT_URL ||
    "https://docs.numerique.gouv.fr/docs/8354b3be-0f1f-4690-8f89-a6c4a738f374",
  visitSenderEmail: process.env.VISIT_MAIL_SENDER || "secretariat@beta.gouv.fr",
  visitRecipientEmail:
    process.env.VISIT_MAIL_RECIPIENT || "espace-membre@incubateur.net",
  githubBetagouvTeam: process.env.GITHUB_BETAGOUV_TEAM || "beta-gouv-fr",
  MATOMO_TOKEN: process.env.MATOMO_TOKEN,
  MATOMO_API_URL: process.env.MATOMO_API_URL,
  SENTRY_API_URL: process.env.SENTRY_API_URL,
  SENTRY_TOKEN: process.env.SENTRY_TOKEN,
  SENTRY_ORGANIZATION: process.env.SENTRY_ORGANIZATION,
};

const REQUIRED_APP_KEY = ["SESSION_SECRET"];
if (APP_TYPE === "app") {
  REQUIRED_APP_KEY.forEach((key) => {
    getOrThrowError(key);
  });
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  ...CRON_TASK_ENV_VAR,
  AUTH_URL: process.env.AUTH_URL,
  secret: process.env.SESSION_SECRET!,
  SESSION_COOKIE_NAME: "espaceMembreCookieName",
  secure: isSecure,
  protocol: isSecure ? "https" : "http",
  host: process.env.HOSTNAME,
  port: parseInt(process.env.PORT || "3000", 10),
  domain: process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr",
  DS_TOKEN: process.env.DS_TOKEN,
  DS_DEMARCHE_NUMBER: process.env.DS_DEMARCHE_NUMBER
    ? parseInt(process.env.DS_DEMARCHE_NUMBER)
    : null,
  user: {
    statusOptions: userStatusOptions,
    minStartDate: "2013-07-01",
    memberOptions: memberTypeOptions,
  },
  senderEmail: process.env.MAIL_SENDER || "espace-membre@incubateur.net",
  githubOrganizationName: process.env.GITHUB_ORGANIZATION_NAME || "betagouv",
  githubOrgAdminToken: process.env.GITHUB_ORG_ADMIN_TOKEN,
  sentryDSN: process.env.SENTRY_DSN || false,
  ESPACE_MEMBRE_ADMIN: process.env.ESPACE_MEMBRE_ADMIN
    ? process.env.ESPACE_MEMBRE_ADMIN.split(",")
    : [],
  MAILING_LIST_NEWSLETTER: parseInt(getOrThrowError("MAILING_LIST_NEWSLETTER")),
  MAILING_LIST_ONBOARDING: process.env.MAILING_LIST_ONBOARDING
    ? parseInt(process.env.MAILING_LIST_ONBOARDING)
    : null,
  MAILING_LIST_REMINDER: process.env.MAILING_LIST_REMINDER
    ? parseInt(process.env.MAILING_LIST_REMINDER)
    : null,
  NEWSLETTER_NUMBER_OF_DAYS_WITH_LAST_NEWSLETTER: process.env
    .NEWSLETTER_NUMBER_OF_DAYS_WITH_LAST_NEWSLETTER
    ? parseInt(process.env.NEWSLETTER_NUMBER_OF_DAYS_WITH_LAST_NEWSLETTER, 10)
    : 10,
  incubateurMailingListName:
    process.env.INCUBATEUR_MAILING_LIST_NAME || "incubateur",
  JOBS_API: process.env.JOBS_API || "https://beta.gouv.fr/api/v2.5/jobs.json",
  JOBS_WTTJ_API: process.env.JOBS_WTTJ_API,
  leavesEmail: process.env.LEAVES_EMAIL || "depart@beta.gouv.fr",
  // If both emails of the users are already in sib update will not work
  FEATURE_SIB_USE_UPDATE_CONTACT_EMAIL:
    process.env.FEATURE_SIB_USE_UPDATE_CONTACT_EMAIL === "true",
  SIB_WEBHOOK_ID: process.env.SIB_WEBHOOK_ID,
  SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE,
  SIB_APIKEY_PUBLIC: process.env.SIB_APIKEY_TECH_PUBLIC,
  SIB_APIKEY_TECH_PRIVATE: process.env.SIB_APIKEY_TECH_PRIVATE!,
  SIB_APIKEY_TECH_PUBLIC: process.env.SIB_APIKEY_TECH_PUBLIC,
  tchap_api: process.env.TCHAP_API,
  HASH_SALT: process.env.HASH_SALT,
  PASSWORD_ENCRYPT_KEY: process.env.PASSWORD_ENCRYPT_KEY,
  PASSWORD_IV_KEY: process.env.PASSWORD_IV_KEY,
  SUPPORT_EMAIL: process.env.NEXT_SUPPORT_EMAIL,
  S3_KEY_ID: process.env.S3_KEY_ID,
  S3_KEY_SECRET: process.env.S3_KEY_SECRET,
  S3_HOST: process.env.S3_HOST,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_GET_HOST: process.env.S3_GET_HOST,
  S3_REGION: process.env.S3_REGION,
  // basic protection for public api routes
  PROTECTED_API_KEYS: getArrayFromEnv("PROTECTED_API_KEYS"),
  PROTECTED_API_ALLOWED_ORIGINS: getArrayFromEnv(
    "PROTECTED_API_ALLOWED_ORIGINS",
    ["gouv.fr", "ademe.fr"],
  ),
  SENTRY_WEBSITE_URL: process.env.SENTRY_WEBSITE_URL,
  FEATURE_TMP_SHOW_ONBOARDING_TO_EVERYONE:
    process.env.FEATURE_TMP_SHOW_ONBOARDING_TO_EVERYONE === "true",
};
