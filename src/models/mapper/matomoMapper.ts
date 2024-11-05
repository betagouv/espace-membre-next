import { Selectable } from "kysely";

import { matomoUserSchemaType } from "../matomo";
import { ACCOUNT_SERVICE_STATUS } from "../services";
import { ServiceAccounts } from "@/@types/db";
import { MatomoUser, MatomoUserAccess, MatomoSite } from "@/lib/matomo";

export const matomoUserToModel = (
    matomoUser: MatomoUser,
    userMetadata: MatomoUserAccess[],
    allWebsites: MatomoSite[]
): matomoUserSchemaType => {
    const sites: matomoUserSchemaType["metadata"]["sites"] = userMetadata.map(
        (u) => {
            const site = allWebsites.find((site) => site.idsite === u.site);
            return {
                id: u.site,
                accessLevel: u.access,
                url: site ? site.main_url : undefined,
                name: site ? site.name : "",
                type: site?.type as matomoUserSchemaType["metadata"]["sites"][0]["type"],
            };
        }
    );
    return {
        email: matomoUser.email,
        account_type: "matomo",
        service_user_id: matomoUser.login,
        metadata: {
            sites,
        },
        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
    };
};

export const matomoServiceInfoToModel = (
    matomoUser: Selectable<ServiceAccounts>
): matomoUserSchemaType => {
    return {
        account_type: "matomo",
        service_user_id: matomoUser.service_user_id,
        metadata: (matomoUser.metadata || {
            sites: [],
        }) as matomoUserSchemaType["metadata"],
        status:
            (matomoUser.status as ACCOUNT_SERVICE_STATUS) ||
            ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
    };
};
