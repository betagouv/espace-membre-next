"use server";

import crypto from "crypto";
import { getServerSession } from "next-auth";
import PgBoss from "pg-boss";
import { match } from "ts-pattern";

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
    CreateMatomoAccountDataSchema,
    CreateSentryAccountDataSchema,
    UpdateSentryAccountDataSchema,
} from "@/models/jobs/services";
import { memberBaseInfoToModel } from "@/models/mapper";
import { memberBaseInfoSchemaType } from "@/models/member";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { encryptPassword } from "@/server/controllers/utils";
import { getBossClientInstance } from "@/server/queueing/client";
import { createMatomoServiceAccountTopic } from "@/server/queueing/workers/create-matomo-account";
import { createSentryServiceAccountTopic } from "@/server/queueing/workers/create-sentry-account";
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
        console.log("LCS TOTO 1");
        const session = await getServerSession(authOptions);
        if (!session || !session.user.id) {
            throw new AuthorizationError();
        }
        const bossClient = await getBossClientInstance();
        const dbData = await getUserBasicInfo({ username: session.user.id });
        console.log("LCS TOTO 2");
        if (!dbData) {
            throw new NoDataError();
        }
        const user = memberBaseInfoToModel(dbData);
        console.log("LCS TOTO 3", service, data);
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
    console.log("LCS TATA");
    const sentryAccount = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("account_type", "=", SERVICES.SENTRY)
        .where("user_id", "=", user.uuid)
        .executeTakeFirst();
    const accountAlreadyExists = !!sentryAccount?.service_user_id;
    if (accountAlreadyExists) {
        console.log("LCS TATA 2");
        const teams = sentryData.teams.map((t) => ({
            teamSlug: t.name,
            teamRole: SentryRole.contributor,
        }));
        await bossClient.send(
            updateSentryServiceAccountTopic,
            UpdateSentryAccountDataSchema.parse({
                email: user.primary_email,
                username: user.username,
                userUuid: user.uuid,
                memberId: sentryAccount.service_user_id,
                teams,
            })
        );
        console.log("LCS TATA 3");

        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED,
            action_metadata: {
                service: SERVICES.SENTRY,
                teams,
            },
            action_on_username: user.username,
            created_by_username: user.username,
        });
        console.log("LCS TATA 4");
    } else {
        await bossClient.send(
            createSentryServiceAccountTopic,
            CreateSentryAccountDataSchema.parse({
                email: user.primary_email,
                username: user.username,
                userUuid: user.uuid,
                teams,
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
    await bossClient.send(
        createMatomoServiceAccountTopic,
        CreateMatomoAccountDataSchema.parse({
            email: user.primary_email,
            login: user.primary_email,
            username: user.username,
            password: encryptPassword(
                crypto.randomBytes(20).toString("base64").slice(0, -2)
            ),
            sites: matomoData.sites,
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

    await addEvent({
        action_code: EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED,
        action_metadata: {
            service: SERVICES.MATOMO,
            sites: matomoData.sites.map((s) => ({
                url: s.url,
                access: MatomoAccess.admin,
            })),
        },
        action_on_username: user.username,
        created_by_username: user.username,
    });
};
