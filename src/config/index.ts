import { MemberType } from "@/models/dbUser";
import { config } from "dotenv";

config();

const isSecure = (process.env.SECURE || "true") === "true";

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
    { name: "Attributaire", key: MemberType.ATTRIBUTAIRE },
    {
        name: `Membre d'un autre service DINUM (etalab, ...)`,
        key: MemberType.DINUM,
    },
    { name: `Autre`, key: MemberType.OTHER },
];

const userBadgeOptions = [{ name: "Ségur (Paris)", key: "segur" }];

export default {
    API_SERVER: process.env.NEXT_PUBLIC_API_SERVER || "http://localhost:8100",
    secret: process.env.SESSION_SECRET,
    secure: isSecure,
    protocol: isSecure ? "https" : "http",
    host: process.env.HOSTNAME || "localhost:3000",
    port: process.env.PORT || 3100,
    domain: process.env.SECRETARIAT_DOMAIN || "beta.gouv.fr",
    DS_TOKEN: process.env.DS_TOKEN,
    DS_DEMARCHE_NUMBER: process.env.DS_DEMARCHE_NUMBER
        ? parseInt(process.env.DS_DEMARCHE_NUMBER)
        : null,
    DS_DEMARCHE_ID: process.env.DS_DEMARCHE_ID,
    user: {
        statusOptions: userStatusOptions,
        minStartDate: "2013-07-01",
        badgeOptions: userBadgeOptions,
        memberOptions: memberTypeOptions,
    },
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
