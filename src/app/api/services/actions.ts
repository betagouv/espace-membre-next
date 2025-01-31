"use server";

import crypto from "crypto";
import { getServerSession } from "next-auth";
import PgBoss from "pg-boss";
import { match } from "ts-pattern";
import { v4 as uuidv4 } from "uuid";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { MatomoAccess } from "@/lib/matomo";
import { SentryRole } from "@/lib/sentry";
import { EventCode } from "@/models/actionEvent";
import {
    matomoAccountRequestSchema,
    matomoAccountRequestSchemaType,
    matomoAccountRequestWrapperSchema,
    matomoAccountRequestWrapperSchemaType,
    sentryAccountRequestSchema,
    sentryAccountRequestSchemaType,
    sentryAccountRequestWrapperSchema,
    sentryAccountRequestWrapperSchemaType,
} from "@/models/actions/service";
import {
    CreateOrUpdateMatomoAccountDataSchema,
    CreateSentryAccountDataSchema,
    UpdateSentryAccountDataSchema,
} from "@/models/jobs/services";
import { memberBaseInfoToModel } from "@/models/mapper";
import { memberBaseInfoSchemaType } from "@/models/member";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { encryptPassword } from "@/server/controllers/utils";
import { getBossClientInstance } from "@/server/queueing/client";
import { createSentryServiceAccountTopic } from "@/server/queueing/workers/create-sentry-account";
import { createOrUpdateMatomoServiceAccountTopic } from "@/server/queueing/workers/create-update-matomo-account";
import {
    updateSentryServiceAccount,
    updateSentryServiceAccountTopic,
} from "@/server/queueing/workers/update-sentry-account";
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
        | sentryAccountRequestWrapperSchemaType) => {
        // create task
        const session = await getServerSession(authOptions);
        if (!session || !session.user.id) {
            throw new AuthorizationError();
        }
        const bossClient = await getBossClientInstance();
        const dbData = await getUserBasicInfo({ username: session.user.id });
        if (!dbData) {
            throw new NoDataError();
        }
        const user = memberBaseInfoToModel(dbData);
        await match(service)
            .with(SERVICES.MATOMO, async () => {
                await createOrUpdateMatomoAccount(
                    user,
                    matomoAccountRequestSchema.parse(data),
                    bossClient
                );
            })
            .with(SERVICES.SENTRY, async () => {
                await createOrUpdateSentryAccount(
                    user,
                    sentryAccountRequestSchema.parse(data),
                    bossClient
                );
            })

            .otherwise(() => {
                // otherwise or exhaustive has to be defined otherwise function is not awaited
                // cf https://github.com/gvergnaud/ts-pattern/issues/163
            });
    }
);

const createOrUpdateSentryAccount = async (
    user: memberBaseInfoSchemaType,
    sentryData: sentryAccountRequestSchemaType,
    bossClient: PgBoss
) => {
    if (!user.primary_email) {
        throw new ValidationError("Un email primaire est obligatoire");
    }
    const sentryAccount = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("account_type", "=", SERVICES.SENTRY)
        .where("user_id", "=", user.uuid)
        .executeTakeFirst();
    const accountAlreadyExists = !!sentryAccount?.service_user_id;
    const teams = sentryData.teams.map((t) => ({
        teamSlug: t.name,
        teamRole: SentryRole.contributor,
    }));
    const requestId = uuidv4();
    if (accountAlreadyExists) {
        await bossClient.send(
            updateSentryServiceAccountTopic,
            UpdateSentryAccountDataSchema.parse({
                email: user.primary_email,
                username: user.username,
                userUuid: user.uuid,
                memberId: sentryAccount.service_user_id,
                teams,
                requestId,
            })
        );

        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED,
            action_metadata: {
                service: SERVICES.SENTRY,
                teams,
                requestId,
            },
            action_on_username: user.username,
            created_by_username: user.username,
        });
    } else {
        await bossClient.send(
            createSentryServiceAccountTopic,
            CreateSentryAccountDataSchema.parse({
                email: user.primary_email,
                username: user.username,
                userUuid: user.uuid,
                teams,
                requestId,
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

        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED,
            action_metadata: {
                service: SERVICES.SENTRY,
                teams,
                requestId,
            },
            action_on_username: user.username,
            created_by_username: user.username,
        });
    }
};

const createOrUpdateMatomoAccount = async (
    user: memberBaseInfoSchemaType,
    matomoData: matomoAccountRequestSchemaType,
    bossClient: PgBoss
) => {
    if (!user.primary_email) {
        throw new ValidationError("Un email primaire est obligatoire");
    }
    const matomoAccount = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("account_type", "=", SERVICES.MATOMO)
        .where("user_id", "=", user.uuid)
        .executeTakeFirst();
    const matomoAlreadyExists = !!matomoAccount?.service_user_id;
    const requestId = uuidv4();

    const callPgBoss = async () => {
        await bossClient.send(
            createOrUpdateMatomoServiceAccountTopic,
            CreateOrUpdateMatomoAccountDataSchema.parse({
                email: user.primary_email,
                login: user.primary_email,
                username: user.username,
                requestId: requestId,
                password: encryptPassword(
                    crypto.randomBytes(20).toString("base64").slice(0, -2)
                ),
                sites: matomoData.sites,
                newSite: matomoData.newSite,
            }),
            {
                retryLimit: 50,
                retryBackoff: true,
            }
        );
    };

    if (matomoAlreadyExists) {
        await callPgBoss();
        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED,
            action_metadata: {
                service: SERVICES.MATOMO,
                requestId: requestId,
                sites: (matomoData.sites || []).map((s) => ({
                    id: s.id,
                    access: MatomoAccess.admin,
                })),
                newSite: matomoData.newSite
                    ? {
                          url: matomoData.newSite.url,
                          name: matomoData.newSite.name,
                          type: matomoData.newSite.type,
                          access: MatomoAccess.admin,
                          startupId: matomoData.newSite.startupId,
                      }
                    : undefined,
            },
            action_on_username: user.username,
            created_by_username: user.username,
        });
    } else {
        await callPgBoss();
        await db
            .insertInto("service_accounts")
            .values({
                user_id: user.uuid,
                email: user.primary_email,
                account_type: SERVICES.MATOMO,
                status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
            })
            .execute();

        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED,
            action_metadata: {
                requestId: requestId,
                service: SERVICES.MATOMO,
                sites: (matomoData.sites || []).map((s) => ({
                    id: s.id,
                    access: MatomoAccess.admin,
                })),
                newSite: matomoData.newSite
                    ? {
                          url: matomoData.newSite.url,
                          name: matomoData.newSite.name,
                          type: matomoData.newSite.type,
                          access: MatomoAccess.admin,
                          startupId: matomoData.newSite.startupId,
                      }
                    : undefined,
            },
            action_on_username: user.username,
            created_by_username: user.username,
        });
    }
};
