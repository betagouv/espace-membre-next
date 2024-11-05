"use server";

import crypto from "crypto";
import { getServerSession } from "next-auth";
import { match } from "ts-pattern";

import { db } from "@/lib/kysely";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { matomoAccountRequestWrapperSchemaType } from "@/models/actions/service";
import {
    CreateMattermostAccountDataSchema,
    CreateMatomoAccountDataSchema,
} from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { encryptPassword } from "@/server/controllers/utils";
import { getBossClientInstance } from "@/server/queueing/client";
import {
    createMattermostServiceAccountTopic,
    createMatomoServiceAccountTopic,
} from "@/server/queueing/workers/create-mattermost-account";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    NoDataError,
    ValidationError,
    withErrorHandling,
} from "@/utils/error";

export const askAccountCreationForService = withErrorHandling(
    async ({
        service,
        data,
    }:
        | matomoAccountRequestWrapperSchemaType
        | { service: SERVICES.MATTERMOST; data: any }) => {
        // create task
        const session = await getServerSession(authOptions);
        if (!session || !session.user.id) {
            throw new AuthorizationError();
        }
        const bossClient = await getBossClientInstance();
        const user = await getUserBasicInfo({ uuid: session.user.uuid });
        const startups = await getUserStartups(session.user.uuid);
        if (!user) throw new NoDataError("User count not be found");
        match(service)
            .with(SERVICES.MATOMO, async () => {
                if (!user.primary_email) {
                    throw new ValidationError(
                        "Un email primaire est obligatoire"
                    );
                }
                await bossClient.send(
                    createMatomoServiceAccountTopic,
                    CreateMatomoAccountDataSchema.parse({
                        email: user.primary_email,
                        login: user.primary_email,
                        password: encryptPassword(
                            data.password ||
                                crypto
                                    .randomBytes(20)
                                    .toString("base64")
                                    .slice(0, -2)
                        ),
                        sites: data.sites,
                    }),
                    {
                        retryLimit: 50,
                        retryBackoff: true,
                    }
                );
                await db
                    .insertInto("service_accounts")
                    .values({
                        user_id: user.uuid,
                        service_user_id: user.username, // todo: there is not service_user_id at this moment
                        email: user.primary_email,
                        account_type: SERVICES.MATOMO,
                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                    })
                    .execute();
            })
            .with(SERVICES.MATTERMOST, async () => {
                if (!user.primary_email) {
                    throw new ValidationError(
                        "Un email primaire est obligatoire"
                    );
                }
                await db
                    .insertInto("service_accounts")
                    .values({
                        user_id: user.uuid,
                        service_user_id: user.username,
                        account_type: SERVICES.MATTERMOST,
                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                    })
                    .execute();
                await bossClient.send(
                    createMattermostServiceAccountTopic,
                    CreateMattermostAccountDataSchema.parse({
                        email: user.primary_email,
                        username: user.username,
                        password: crypto
                            .randomBytes(20)
                            .toString("base64")
                            .slice(0, -2),
                        position: `${user.role} @ ${startups
                            .map((s) => s.name)
                            .join(",")}`,
                    }),
                    {
                        retryLimit: 50,
                        retryBackoff: true,
                    }
                );
            });
    }
);
