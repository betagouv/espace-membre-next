import { createRouter, defineRoute, param } from "type-route";
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
        community: defineRoute(
            localizedRoutes.community.params,
            localizedRoutes.community.paths.fr
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
    }).routes,
};
