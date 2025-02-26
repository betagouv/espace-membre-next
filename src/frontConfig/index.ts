import { config } from "dotenv";
import { z } from "zod";

import { MemberType } from "@/models/member";

config();

const isSecure = (process.env.SECURE || "true") === "true";

export const userStatusOptions = [
    { name: "Indépendant", key: "independent" },
    {
        name: "Agent Public (fonctionnaire ou sous contrat stage, alternance, CDD ou CDI avec une structure publique)",
        key: "admin",
    },
    { name: "Société de service", key: "service" },
];

export const memberTypeOptions = [
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
const alertMessageSchema = z.object({
    description: z.string().optional(),
    title: z.string(),
    severity: z.enum(["info", "warning"]),
});

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    secret: process.env.SESSION_SECRET,
    secure: isSecure,
    protocol: isSecure ? "https" : "http",
    host: process.env.HOSTNAME || "127.0.0.1:8100",
    port: process.env.PORT || 8100,
    domain: process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr",
    ESPACE_MEMBRE_ADMIN: process.env.ESPACE_MEMBRE_ADMIN
        ? process.env.ESPACE_MEMBRE_ADMIN.split(",")
        : [],
    DS_BADGE_FORM_URL: process.env.NEXT_PUBLIC_DS_BADGE_FORM_URL,
    DS_BADGE_RENEWAL_FORM_URL:
        process.env.NEXT_PUBLIC_DS_BADGE_RENEWAL_FORM_URL,
    NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE: process.env
        .NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE
        ? alertMessageSchema.parse(
              JSON.parse(process.env.NEXT_PUBLIC_ALERT_MESSAGE_PRIVATE)
          )
        : undefined,
    NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC: process.env
        .NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC
        ? alertMessageSchema.parse(
              JSON.parse(process.env.NEXT_PUBLIC_ALERT_MESSAGE_PUBLIC)
          )
        : undefined,
    CHATWOOT_WEBSITE_TOKEN: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN,
    NEXT_PUBLIC_CHAT_SUPPORT_SERVICE:
        process.env.NEXT_PUBLIC_CHAT_SUPPORT_SERVICE,
    SPONSOR_API:
        process.env.NEXT_PUBLIC_SPONSOR_API ||
        "https://beta.gouv.fr/api/v2.6/sponsors.json",
    usersAPI:
        process.env.USERS_API || "https://beta.gouv.fr/api/v2.6/authors.json",
    incubatorAPI:
        process.env.NEXT_PUBLIC_INCUBATOR_API ||
        "https://beta.gouv.fr/api/v2.6/incubators.json",
    startupsAPI:
        process.env.STARTUPS_API ||
        "https://beta.gouv.fr/api/v2.6/startups.json",
    startupsDetailsAPI:
        process.env.STARTUPS_DETAILS_API ||
        "https://beta.gouv.fr/api/v2.6/startups_details.json",
    SUPPORT_EMAIL: process.env.NEXT_SUPPORT_EMAIL,
    tchap_api: process.env.TCHAP_API,
    HASH_SALT: process.env.HASH_SALT,
    matomoUrl: process.env.NEXT_PUBLIC_MATOMO_URL,
    matomoSiteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
    FEATURE_SHOW_UPLOAD_IMAGE_PRODUCT_WIDGET:
        process.env.NEXT_PUBLIC_FEATURE_SHOW_UPLOAD_IMAGE_PRODUCT_WIDGET,
};
