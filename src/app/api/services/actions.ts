"use server";

import slugify from "@sindresorhus/slugify";
import crypto from "crypto";
import _ from "lodash";
import { getServerSession } from "next-auth";
import PgBoss from "pg-boss";
import { match } from "ts-pattern";
import { v4 as uuidv4 } from "uuid";

import { addEvent } from "@/lib/events";
import { db, sql } from "@/lib/kysely";
import { getStartup } from "@/lib/kysely/queries";
import { getServiceAccount } from "@/lib/kysely/queries/services";
import {
    getUserBasicInfo,
    getUserStartupsActive,
} from "@/lib/kysely/queries/users";
import { MatomoAccess } from "@/lib/matomo";
import { generateSentryTeamSlug, SentryRole } from "@/lib/sentry";
import { EventCode } from "@/models/actionEvent";
import {
    matomoAccountRequestSchema,
    matomoAccountRequestSchemaType,
    matomoAccountRequestWrapperSchemaType,
    sentryAccountRequestSchema,
    sentryAccountRequestSchemaType,
    sentryAccountRequestWrapperSchemaType,
} from "@/models/actions/service";
import {
    CreateOrUpdateMatomoAccountDataSchema,
    CreateSentryAccountDataSchema,
    CreateSentryTeamDataSchema,
    UpdateSentryAccountDataSchema,
} from "@/models/jobs/services";
import { memberBaseInfoToModel } from "@/models/mapper";
import { memberBaseInfoSchemaType } from "@/models/member";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { encryptPassword } from "@/server/controllers/utils";
import { getBossClientInstance } from "@/server/queueing/client";
import { createSentryServiceAccountTopic } from "@/server/queueing/workers/create-sentry-account";
import { createSentryTeamTopic } from "@/server/queueing/workers/create-sentry-team";
import { createOrUpdateMatomoServiceAccountTopic } from "@/server/queueing/workers/create-update-matomo-account";
import { updateSentryServiceAccountTopic } from "@/server/queueing/workers/update-sentry-account";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    BusinessError,
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
                    bossClient,
                );
            })
            .with(SERVICES.SENTRY, async () => {
                await createOrUpdateSentryAccount(
                    user,
                    sentryAccountRequestSchema.parse(data),
                    bossClient,
                    session.user.isAdmin,
                );
            })

            .otherwise(() => {
                // otherwise or exhaustive has to be defined otherwise function is not awaited
                // cf https://github.com/gvergnaud/ts-pattern/issues/163
            });
    },
);

const createOrUpdateSentryAccount = async (
    user: memberBaseInfoSchemaType,
    sentryData: sentryAccountRequestSchemaType,
    bossClient: PgBoss,
    isAdmin: boolean = false,
) => {
    if (!user.primary_email) {
        throw new ValidationError("Un email primaire est obligatoire");
    }
    const userStartups = (await getUserStartupsActive(user.uuid)).map(
        (startup) => startup.uuid,
    );
    const startupsByTeamName = (
        "teams" in sentryData
            ? await db
                  .selectFrom("sentry_teams")
                  .where(
                      "slug",
                      "in",
                      sentryData.teams.map((t) => t.slug),
                  )
                  .selectAll()
                  .execute()
            : []
    ).map((team) => team.startup_id);

    const allRequestedStartupAreAuthorized = _.every(
        startupsByTeamName,
        (item) => _.includes(userStartups, item),
    );
    const newTeamStartupIsAuthorized =
        !("newTeam" in sentryData) ||
        userStartups.includes(sentryData.newTeam.startupId);

    const canRequestAccessToStartup: boolean =
        isAdmin ||
        (allRequestedStartupAreAuthorized && newTeamStartupIsAuthorized);

    if (!canRequestAccessToStartup) {
        throw new AuthorizationError(
            "User does not work for at leat one of the provided teams",
        );
    }
    const sentryAccount = await getServiceAccount(user.uuid, SERVICES.SENTRY);
    const accountAlreadyExists = !!sentryAccount?.service_user_id;

    const teams =
        "teams" in sentryData && sentryData.teams
            ? sentryData.teams.map((t) => ({
                  teamSlug: t.slug,
                  teamRole: SentryRole.contributor,
              }))
            : [];
    const requestId = uuidv4();
    const job = await getSentryJob(user.uuid, sentryData, teams);
    if (job) {
        throw new BusinessError(
            "aSentryJobAlreadyExist",
            `Tu as déjà une demande en cours pour ajouter ces équipes.`,
        );
    }

    if ("newTeam" in sentryData && sentryData.newTeam) {
        const startup = await getStartup({
            uuid: sentryData.newTeam.startupId,
        });
        if (!startup) {
            throw new NoDataError("Startup not found");
        }
        const jobId = await bossClient.send(
            createSentryTeamTopic,
            CreateSentryTeamDataSchema.parse({
                email: user.primary_email,
                username: user.username,
                userUuid: user.uuid,
                requestId,
                startupId: sentryData.newTeam.startupId,
            }),
            {
                retryLimit: 50,
                retryBackoff: true,
            },
        );
        const newTeam = {
            teamSlug: generateSentryTeamSlug(startup.name),
            teamRole: SentryRole.admin,
        };
        teams.push(newTeam);
        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_TEAM_CREATION_REQUESTED,
            action_metadata: {
                jobId: jobId,
                service: SERVICES.SENTRY,
                startupId: sentryData.newTeam.startupId,
                requestId: requestId,
                team: {
                    teamSlug: newTeam.teamSlug,
                },
            },
            action_on_username: user.username,
            created_by_username: user.username,
        });
    }
    if (accountAlreadyExists) {
        const jobId = await bossClient.send(
            updateSentryServiceAccountTopic,
            UpdateSentryAccountDataSchema.parse({
                email: user.primary_email,
                username: user.username,
                userUuid: user.uuid,
                memberId: sentryAccount.service_user_id,
                teams,
                requestId,
            }),
            {
                retryLimit: 50,
                retryBackoff: true,
            },
        );

        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED,
            action_metadata: {
                jobId: jobId,
                service: SERVICES.SENTRY,
                teams,
                requestId,
            },
            action_on_username: user.username,
            created_by_username: user.username,
        });
    } else {
        const jobId = await bossClient.send(
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
            },
        );
        if (!sentryAccount) {
            await db
                .insertInto("service_accounts")
                .values({
                    user_id: user.uuid,
                    email: user.primary_email,
                    account_type: SERVICES.SENTRY,
                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                })
                .execute();
        }

        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED,
            action_metadata: {
                jobId: jobId,
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
    bossClient: PgBoss,
) => {
    if (!user.primary_email) {
        throw new ValidationError("Un email primaire est obligatoire");
    }
    const matomoAccountInDb = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("account_type", "=", SERVICES.MATOMO)
        .where("user_id", "=", user.uuid)
        .executeTakeFirst();

    const matomoAlreadyExists = !!matomoAccountInDb?.service_user_id;
    const requestId = uuidv4();
    const job = await getMatomoJob(user.username, matomoData);
    if (job) {
        throw new BusinessError(
            "aMatomoJobAlreadyExist",
            `Tu as déjà une demande en cours pour ajouter ces sites.`,
        );
    }

    const callPgBoss = async () => {
        return await bossClient.send(
            createOrUpdateMatomoServiceAccountTopic,
            CreateOrUpdateMatomoAccountDataSchema.parse({
                email: user.primary_email,
                login: user.primary_email,
                username: user.username,
                userUuid: user.uuid,
                requestId: requestId,
                password: encryptPassword(
                    crypto.randomBytes(20).toString("base64").slice(0, -2),
                ),
                sites: matomoData.sites,
                newSite: matomoData.newSite,
            }),
            {
                retryLimit: 50,
                retryBackoff: true,
            },
        );
    };

    if (matomoAlreadyExists) {
        const jobId = await callPgBoss();
        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_UPDATE_REQUESTED,
            action_metadata: {
                jobId,
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
        const jobId = await callPgBoss();
        // user may have requested several website creation at the same time
        // while is account in matomo still not exist
        if (!matomoAccountInDb) {
            // matomo is being created
            await db
                .insertInto("service_accounts")
                .values({
                    user_id: user.uuid,
                    email: user.primary_email,
                    account_type: SERVICES.MATOMO,
                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                })
                .execute();
        }

        await addEvent({
            action_code: EventCode.MEMBER_SERVICE_ACCOUNT_REQUESTED,
            action_metadata: {
                jobId: jobId,
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

async function getMatomoJob(
    userUuid: string,
    matomoData: matomoAccountRequestSchemaType,
) {
    let query = db
        .selectFrom("pgboss.job")
        .selectAll()
        .where("state", "in", ["active", "retry", "created"])
        .where("data", "@>", JSON.stringify({ userUuid }));

    if (matomoData.sites) {
        query = query.where(
            "data",
            "@>",
            JSON.stringify({ sites: matomoData.sites }),
        );
    }

    if (matomoData.newSite) {
        query = query.where(
            "data",
            "@>",
            JSON.stringify({ newSite: matomoData.newSite }),
        );
    }

    const job = await query.executeTakeFirst();
    return job;
}

async function getSentryJob(
    userUuid: string,
    sentryData: sentryAccountRequestSchemaType,
    teams: { teamSlug: string; teamRole: SentryRole }[],
) {
    let query = db
        .selectFrom("pgboss.job")
        .selectAll()
        .where("state", "in", ["active", "retry", "created"])
        .where("data", "@>", JSON.stringify({ userUuid }))
        .where("data", "@>", JSON.stringify({ teams: teams }));

    if ("newTeam" in sentryData && sentryData.newTeam) {
        query = query.where(
            "data",
            "@>",
            JSON.stringify({ startupId: sentryData.newTeam.startupId }),
        );
    }

    const job = await query.executeTakeFirst();
    return job;
}
