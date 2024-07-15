import { param } from "type-route";

import { defineLocalizedRoute } from "./common";

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
    accountBadgeRenewal: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/account/badge-demande/renouvellement`,
        }
    ),
    community: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/community`,
        }
    ),
    communityCreateMember: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/community/create`,
        }
    ),
    dashboard: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/dashboard`,
        }
    ),
    incubatorDetailsEdit: defineLocalizedRoute(
        { incubatorId: param.path.string },
        {
            fr: (p) => `/incubators/${p.incubatorId}`,
        }
    ),
    incubatorList: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/incubators`,
        }
    ),
    incubatorCreate: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/incubators/create-form`,
        }
    ),
    incubatorDetails: defineLocalizedRoute(
        { incubatorId: param.path.string },
        {
            fr: (p) => `/incubators/${p.incubatorId}`,
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
    onboardingSuccess: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/onboardingSuccess`,
        }
    ),
    newsletters: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/newsletters`,
        }
    ),
    map: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/map`,
        }
    ),
    keskispasse: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/keskispasse`,
        }
    ),
    eventsList: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/events`,
        }
    ),
    formationList: defineLocalizedRoute(
        {},
        {
            fr: (p) => `/formations`,
        }
    ),
    formationDetails: defineLocalizedRoute(
        {},
        {
            fr: (p) => "/formations/.*",
        }
    ),
    verifyMember: defineLocalizedRoute(
        {},
        {
            fr: (p) => "/verify",
        }
    ),
};
