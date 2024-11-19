import { Selectable } from "kysely";

import { matomoUserSchemaType } from "../matomo";
import { ACCOUNT_SERVICE_STATUS } from "../services";
import { ServiceAccounts } from "@/@types/db";
import { MatomoUser, MatomoUserAccess, MatomoSite } from "@/lib/matomo";

export const matomoMetadataToModel = (
    userMetadata: MatomoUserAccess[],
    allWebsites: MatomoSite[]
): matomoUserSchemaType["metadata"] => {
    return {
        sites: userMetadata.map((u) => {
            const site = allWebsites.find((site) => site.idsite === u.site);
            return {
                id: u.site,
                accessLevel: u.access,
                url: site ? site.main_url : undefined,
                name: site ? site.name : "",
                type: site?.type as matomoUserSchemaType["metadata"]["sites"][0]["type"],
            };
        }),
    };
};

export const matomoUserToModel = (
    matomoUser: MatomoUser,
    userMetadata: MatomoUserAccess[],
    allWebsites: MatomoSite[]
): matomoUserSchemaType => {
    const metadata: matomoUserSchemaType["metadata"] = matomoMetadataToModel(
        userMetadata,
        allWebsites
    );
    return {
        email: matomoUser.email,
        account_type: "matomo",
        service_user_id: matomoUser.login,
        metadata,
        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
    };
};

export const matomoServiceInfoToModel = (
    matomoUser: Selectable<ServiceAccounts>
): matomoUserSchemaType => {
    return {
        account_type: "matomo",
        email: matomoUser.email!,
        service_user_id: matomoUser.service_user_id || undefined,
        metadata: (matomoUser.metadata || {
            sites: [],
        }) as matomoUserSchemaType["metadata"],
        status:
            (matomoUser.status as ACCOUNT_SERVICE_STATUS) ||
            ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND,
    };
};
