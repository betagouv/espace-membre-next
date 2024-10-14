import { z } from "zod";

import { matomoUserSchemaType } from "../matomo";
import { MatomoUser, MatomoUserAccessDetails } from "@/lib/matomo";

export const matomoUserToModel = (
    matomoUser: MatomoUser,
    userMetadata: MatomoUserAccessDetails[]
): matomoUserSchemaType => {
    return {
        email: matomoUser.email,
        account_type: "matomo",
        service_user_id: matomoUser.login,
        metadata: {
            sites: userMetadata,
        },
    };
};
