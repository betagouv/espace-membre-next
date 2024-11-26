"use server";

import crypto from "crypto";
import { getServerSession } from "next-auth";
import { match } from "ts-pattern";

import { db } from "@/lib/kysely";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import {
    matomoAccountRequestSchema,
    matomoAccountRequestWrapperSchema,
    matomoAccountRequestWrapperSchemaType,
    sentryAccountRequestSchema,
    sentryAccountRequestWrapperSchema,
    sentryAccountRequestWrapperSchemaType,
} from "@/models/actions/service";
import {
    CreateMatomoAccountDataSchema,
    CreateSentryAccountDataSchema,
} from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { encryptPassword } from "@/server/controllers/utils";
import { getBossClientInstance } from "@/server/queueing/client";
import { createMatomoServiceAccountTopic } from "@/server/queueing/workers/create-matomo-account";
import { createSentryServiceAccountTopic } from "@/server/queueing/workers/create-sentry-account";
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
        | sentryAccountRequestWrapperSchemaType
        | { service: SERVICES.MATTERMOST; data: any }) => {
        // create task
        const session = await getServerSession(authOptions);
        if (!session || !session.user.id) {
            throw new AuthorizationError();
        }
        const bossClient = await getBossClientInstance();
        const user = await getUserBasicInfo({ uuid: session.user.uuid });
        if (!user) throw new NoDataError("User count not be found");
        await match(service)
            .with(SERVICES.MATOMO, async () => {
                const matomoData = matomoAccountRequestSchema.parse(data);
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
                        email: user.primary_email,
                        account_type: SERVICES.MATOMO,
                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                    })
                    .execute();
            })
            .with(SERVICES.SENTRY, async () => {
                const sentryData = sentryAccountRequestSchema.parse(data);
                if (!user.primary_email) {
                    throw new ValidationError(
                        "Un email primaire est obligatoire"
                    );
                }
                await bossClient.send(
                    createSentryServiceAccountTopic,
                    CreateSentryAccountDataSchema.parse({
                        email: user.primary_email,
                        teams: sentryData.teams.map((t) => t.name),
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
                        email: user.primary_email,
                        account_type: SERVICES.SENTRY,
                        status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                    })
                    .execute();
            })

            .otherwise(() => {
                // otherwise or exhaustive should be defined otherwise function is not awaited
                // cf https://github.com/gvergnaud/ts-pattern/issues/163
            });
    }
);
