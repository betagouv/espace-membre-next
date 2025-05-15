import { param, createRouter, defineRoute } from "type-route";

export const routes = createRouter({
    account: defineRoute({}, (p) => `/account`),
    accountEditBaseInfo: defineRoute({}, (p) => `/account/base-info`),
    accountEditPrivateInfo: defineRoute({}, (p) => `/account/info`),
    signIn: defineRoute({}, (p) => `/signin`),
    accountBadge: defineRoute({}, (p) => `/account/badge-demande`),
    accountBadgeRenewal: defineRoute(
        {},
        (p) => `/account/badge-demande/renouvellement`
    ),
    community: defineRoute({}, (p) => `/community`),
    communityMember: defineRoute(
        { username: param.path.string },
        (p) => `/community/${p.username}`
    ),
    communityCreateMember: defineRoute({}, (p) => `/community/create`),
    dashboard: defineRoute({}, (p) => `/dashboard`),
    incubatorDetailsEdit: defineRoute(
        { incubatorId: param.path.string },
        (p) => `/incubators/${p.incubatorId}`
    ),
    incubatorList: defineRoute({}, (p) => `/incubators`),
    incubatorCreate: defineRoute({}, (p) => `/incubators/create-form`),
    incubatorDetails: defineRoute(
        { incubatorId: param.path.string },
        (p) => `/incubators/${p.incubatorId}`
    ),
    teamDetailsEdit: defineRoute(
        { teamId: param.path.string },
        (p) => `/teams/${p.teamId}`
    ),
    teamList: defineRoute({}, (p) => `/teams`),
    teamCreate: defineRoute({}, (p) => `/teams/create-form`),
    teamDetails: defineRoute(
        { teamId: param.path.string },
        (p) => `/teams/${p.teamId}`
    ),
    startupsFiles: defineRoute({}, (p) => `/startups/files`),
    startupList: defineRoute({}, (p) => `/startups`),
    startupDetails: defineRoute(
        { startupId: param.path.string },
        (p) => `/startups/${p.startupId}`
    ),
    startupDetailsEdit: defineRoute(
        { startupId: param.path.string },
        (p) => `/startups/${p.startupId}/info-form`
    ),
    startupDocs: defineRoute(
        { startupId: param.path.string },
        (p) => `/startups/${p.startupId}/files`
    ),
    startupCreate: defineRoute({}, (p) => `/startups/create-form`),
    adminMattermost: defineRoute({}, (p) => `/admin/mattermost`),
    home: defineRoute({}, (p) => `/`),
    login: defineRoute({}, (p) => `/login`),
    onboarding: defineRoute({}, (p) => `/onboarding`),
    onboardingSuccess: defineRoute({}, (p) => `/onboardingSuccess`),
    newsletters: defineRoute({}, (p) => `/newsletters`),
    metabase: defineRoute({}, (p) => `/metabase`),
    keskispasse: defineRoute({}, (p) => `/keskispasse`),
    eventsList: defineRoute({}, (p) => `/events`),
    formationList: defineRoute({}, (p) => `/formations`),
    formationDetails: defineRoute({}, (p) => "/formations/.*"),
    verifyMember: defineRoute({}, (p) => "/verify"),
    organizationList: defineRoute({}, (p) => "/organizations"),
    organizationDetails: defineRoute(
        { organizationId: param.path.string },
        (p) => `/organizations/${p.organizationId}`
    ),
    organizationDetailsEdit: defineRoute(
        { organizationId: param.path.string },
        (p) => `/organizations/${p.organizationId}/info-form`
    ),
    organizationCreate: defineRoute({}, (p) => "/organizations/create-form"),
    serviceList: defineRoute({}, (p) => "/services"),
}).routes;
