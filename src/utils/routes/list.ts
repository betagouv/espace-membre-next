import { createRouter, defineRoute, param } from "type-route";

// `ts-import` paths as `compilerOptions` are not working, we modified the import below to use a relative one
// import { Lang, defineLocalizedRoute } from '@mediature/main/src/utils/routes/common';
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

export interface Rewrite {
    source: string;
    destination: string;
}

export function generateRewrites(
    technicalLang: Lang,
    routes: {
        [key in keyof typeof localizedRoutes]: (typeof localizedRoutes)[key];
    }
): Rewrite[] {
    // TODO: find a way to type correctly the routes... :s

    const rewrites: Rewrite[] = [];

    for (const route of Object.values(routes)) {
        for (const pathLang of Object.keys(route.paths)) {
            const typedPathLang = pathLang as Lang;

            if (pathLang === technicalLang) {
                // The technical path does not need a rewrite over itself
                continue;
            }

            const nextjsParameters: any = {};

            for (const [parameterName, parameterValue] of Object.entries(
                route.params
            )) {
                // Maybe there is a need to change the format depending on `parameterValue` (in most case it should be a `param.path.string` from the library `type-safe`)
                nextjsParameters[parameterName] = `:${parameterName}`;
            }

            const source = route.paths[typedPathLang](
                nextjsParameters
            ) as string;
            const destination = route.paths[technicalLang](
                nextjsParameters
            ) as string;

            if (source === destination) {
                // If they are the same, no need to add a rewrite rule :)
                continue;
            }

            rewrites.push({
                source: source,
                destination: destination,
            });
        }
    }

    return rewrites;
}
