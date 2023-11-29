import { param } from "type-route";
import { Lang, defineLocalizedRoute } from "./common";

export const localizedRoutes = {
    account: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/account`,
        }
    ),
    accountEditBaseInfo: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/account/base-info`,
        }
    ),
    accountEditPrivateInfo: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/account/info`,
        }
    ),
    signIn: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/signin`,
        }
    ),
    accountBadge: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/account/badge-demande`,
        }
    ),
    community: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/community`,
        }
    ),
    startupList: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/startups`,
        }
    ),
    startupDetails: defineLocalizedRoute(
        { startupId: param.path.string },
        {
            fr: (p) => `/startups/${p.startupId}`,
        }
    ),
    startupDetailsEdit: defineLocalizedRoute(
        { startupId: param.path.string },
        {
            fr: (p) => `/startups/${p.startupId}/info-form`,
        }
    ),
    startupCreate: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/startups/create-form`,
        }
    ),
    adminMattermost: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/admin/mattermost`,
        }
    ),
    home: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/`,
        }
    ),
    login: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/login`,
        }
    ),
    onboarding: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/onboarding`,
        }
    ),
};
