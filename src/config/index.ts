import { MemberType } from "@/models/dbUser";
import { config } from "dotenv";

config();

const isSecure = (process.env.SECURE || "true") === "true";

export default {
    API_SERVER: process.env.NEXT_PUBLIC_API_SERVER,
    secret: process.env.SESSION_SECRET,
    secure: isSecure,
    protocol: isSecure ? "https" : "http",
    host: process.env.HOSTNAME || "localhost:3000",
    port: process.env.PORT || 3100,
    domain: process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr",
    ESPACE_MEMBRE_ADMIN: process.env.ESPACE_MEMBRE_ADMIN
        ? process.env.ESPACE_MEMBRE_ADMIN.split(",")
        : [],
    DS_BADGE_FORM_URL: process.env.NEXT_PUBLIC_DS_BADGE_FORM_URL,
    DS_BADGE_RENEWAL_FORM_URL:
        process.env.NEXT_PUBLIC_DS_BADGE_RENEWAL_FORM_URL,
    githubRepository: process.env.GITHUB_REPOSITORY,
    SPONSOR_API:
        process.env.NEXT_PUBLIC_SPONSOR_API ||
        "https://beta.gouv.fr/api/v2.5/sponsors.json",
    usersAPI:
        process.env.USERS_API || "https://beta.gouv.fr/api/v2.3/authors.json",
    incubatorAPI:
        process.env.NEXT_PUBLIC_INCUBATOR_API ||
        "https://beta.gouv.fr/api/v2.5/incubators.json",
    startupsAPI:
        process.env.STARTUPS_API ||
        "https://beta.gouv.fr/api/v2.5/startups.json",
    startupsDetailsAPI:
        process.env.STARTUPS_DETAILS_API ||
        "https://beta.gouv.fr/api/v2.3/startups_details.json",
    SUPPORT_EMAIL: process.env.NEXT_SUPPORT_EMAIL,
    tchap_api: process.env.TCHAP_API,
    HASH_SALT: process.env.HASH_SALT,
};
