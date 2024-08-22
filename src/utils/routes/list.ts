import { createRouter, defineRoute } from "type-route";

import { localizedRoutes } from "./localizedRoutes";

// `ts-import` paths as `compilerOptions` are not working, we modified the import below to use a relative one
// import { Lang, defineLocalizedRoute } from '@mediature/main/src/utils/routes/common';

function createLocalizedRouter<
    RouteDefs extends { [routeName in keyof typeof localizedRoutes]: any }
>(routeDefs: RouteDefs) {
    return createRouter(routeDefs);
}

export const routes = {
    fr: createLocalizedRouter({
        account: defineRoute(
            localizedRoutes.account.params,
            localizedRoutes.account.paths.fr
        ),
        signIn: defineRoute(
            localizedRoutes.signIn.params,
            localizedRoutes.signIn.paths.fr
        ),
        accountEditBaseInfo: defineRoute(
            localizedRoutes.accountEditBaseInfo.params,
            localizedRoutes.accountEditBaseInfo.paths.fr
        ),
        accountEditPrivateInfo: defineRoute(
            localizedRoutes.accountEditPrivateInfo.params,
            localizedRoutes.accountEditPrivateInfo.paths.fr
        ),
        accountBadge: defineRoute(
            localizedRoutes.accountBadge.params,
            localizedRoutes.accountBadge.paths.fr
        ),
        accountBadgeRenewal: defineRoute(
            localizedRoutes.accountBadgeRenewal.params,
            localizedRoutes.accountBadgeRenewal.paths.fr
        ),
        community: defineRoute(
            localizedRoutes.community.params,
            localizedRoutes.community.paths.fr
        ),
        communityCreateMember: defineRoute(
            localizedRoutes.communityCreateMember.params,
            localizedRoutes.communityCreateMember.paths.fr
        ),
        dashboard: defineRoute(
            localizedRoutes.dashboard.params,
            localizedRoutes.dashboard.paths.fr
        ),
        startupCreate: defineRoute(
            localizedRoutes.startupCreate.params,
            localizedRoutes.startupCreate.paths.fr
        ),
        startupDetails: defineRoute(
            localizedRoutes.startupDetails.params,
            localizedRoutes.startupDetails.paths.fr
        ),
        startupDetailsEdit: defineRoute(
            localizedRoutes.startupDetailsEdit.params,
            localizedRoutes.startupDetailsEdit.paths.fr
        ),
        startupList: defineRoute(
            localizedRoutes.startupList.params,
            localizedRoutes.startupList.paths.fr
        ),
        adminMattermost: defineRoute(
            localizedRoutes.adminMattermost.params,
            localizedRoutes.adminMattermost.paths.fr
        ),
        home: defineRoute(
            localizedRoutes.home.params,
            localizedRoutes.home.paths.fr
        ),
        login: defineRoute(
            localizedRoutes.login.params,
            localizedRoutes.login.paths.fr
        ),
        onboarding: defineRoute(
            localizedRoutes.onboarding.params,
            localizedRoutes.onboarding.paths.fr
        ),
        onboardingSuccess: defineRoute(
            localizedRoutes.onboardingSuccess.params,
            localizedRoutes.onboardingSuccess.paths.fr
        ),
        newsletters: defineRoute(
            localizedRoutes.newsletters.params,
            localizedRoutes.newsletters.paths.fr
        ),
        map: defineRoute(
            localizedRoutes.map.params,
            localizedRoutes.map.paths.fr
        ),
        metabase: defineRoute(
            localizedRoutes.metabase.params,
            localizedRoutes.metabase.paths.fr
        ),
        keskispasse: defineRoute(
            localizedRoutes.keskispasse.params,
            localizedRoutes.keskispasse.paths.fr
        ),
        eventsList: defineRoute(
            localizedRoutes.eventsList.params,
            localizedRoutes.eventsList.paths.fr
        ),
        formationList: defineRoute(
            localizedRoutes.formationList.params,
            localizedRoutes.formationList.paths.fr
        ),
        formationDetails: defineRoute(
            localizedRoutes.formationDetails.params,
            localizedRoutes.formationDetails.paths.fr
        ),
        verifyMember: defineRoute(
            localizedRoutes.verifyMember.params,
            localizedRoutes.verifyMember.paths.fr
        ),
        incubatorDetailsEdit: defineRoute(
            localizedRoutes.incubatorDetailsEdit.params,
            localizedRoutes.incubatorDetailsEdit.paths.fr
        ),
        incubatorList: defineRoute(
            localizedRoutes.incubatorList.params,
            localizedRoutes.incubatorList.paths.fr
        ),
        incubatorCreate: defineRoute(
            localizedRoutes.incubatorCreate.params,
            localizedRoutes.incubatorCreate.paths.fr
        ),
        incubatorDetails: defineRoute(
            localizedRoutes.incubatorDetails.params,
            localizedRoutes.incubatorDetails.paths.fr
        ),
        organizationDetailsEdit: defineRoute(
            localizedRoutes.organizationDetailsEdit.params,
            localizedRoutes.organizationDetailsEdit.paths.fr
        ),
        organizationList: defineRoute(
            localizedRoutes.organizationList.params,
            localizedRoutes.organizationList.paths.fr
        ),
        organizationCreate: defineRoute(
            localizedRoutes.organizationCreate.params,
            localizedRoutes.organizationCreate.paths.fr
        ),
        organizationDetails: defineRoute(
            localizedRoutes.organizationDetails.params,
            localizedRoutes.organizationDetails.paths.fr
        ),
        teamDetailsEdit: defineRoute(
            localizedRoutes.teamDetailsEdit.params,
            localizedRoutes.teamDetailsEdit.paths.fr
        ),
        teamList: defineRoute(
            localizedRoutes.teamList.params,
            localizedRoutes.teamList.paths.fr
        ),
        teamCreate: defineRoute(
            localizedRoutes.teamCreate.params,
            localizedRoutes.teamCreate.paths.fr
        ),
        teamDetails: defineRoute(
            localizedRoutes.teamDetails.params,
            localizedRoutes.teamDetails.paths.fr
        ),
        startupDocs: defineRoute(
            localizedRoutes.startupDocs.params,
            localizedRoutes.startupDocs.paths.fr
        ),
    }).routes,
};
