import { createRouter, defineRoute } from "type-route";

import { localizedRoutes } from "./localizedRoutes";

// `ts-import` paths as `compilerOptions` are not working, we modified the import below to use a relative one
// import { Lang, defineLocalizedRoute } from '@mediature/main/src/utils/routes/common';

function createLocalizedRouter<RouteDefs extends RoutesDefsType>(
    routeDefs: RouteDefs
) {
    return createRouter(routeDefs);
}

type RouteName = keyof typeof localizedRoutes;
type RoutesDefsType = { [routeName in RouteName]: any };

export const routes = {
    fr: createLocalizedRouter(
        Object.entries(localizedRoutes).reduce(
            (acc, [key, value]) => ({
                ...acc,
                [key]: defineRoute(
                    localizedRoutes[key].params,
                    localizedRoutes[key].paths.fr
                ),
            }),
            {} as RoutesDefsType
        )
    ).routes,
};
