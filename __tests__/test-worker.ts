import PgBoss from "pg-boss";
import proxyquire from "proxyquire";
import sinon from "sinon";

import testUsers from "./users.json";
import utils from "./utils";
import { db } from "@/lib/kysely";
import { MATOMO_SITE_TYPE } from "@/models/actions/service";
import {
    CreateOrUpdateMatomoAccountDataSchemaType,
    CreateSentryAccountDataSchemaType,
} from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { createSentryServiceAccount } from "@/server/queueing/workers/create-sentry-account";
import { createOrUpdateMatomoServiceAccount } from "@/server/queueing/workers/create-update-matomo-account";
import * as controllerUtils from "@controllers/utils";

describe("Service account creation by worker", () => {
    describe("matomo account service consumer", () => {
        let service_accounts;
        before(async function () {
            service_accounts = await db
                .insertInto("service_accounts")
                .values({
                    email: "membre.actif@betagouv.ovh",
                    account_type: "matomo",
                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                })
                .executeTakeFirstOrThrow();
        });
        after(async function () {
            await db
                .deleteFrom("service_accounts")
                .where("uuid", "=", service_accounts.uuid)
                .executeTakeFirstOrThrow();
        });
        it("should create matomo service account", async () => {
            await createOrUpdateMatomoServiceAccount({
                data: {
                    email: "membre.actif@betagouv.ovh",
                    password: controllerUtils.encryptPassword("apassword"),
                    userLogin: "membre.actif@betagouv.ovh",
                    alias: "membre.actif@betagouv.ovh",
                    sites: ["https://beta.gouv.fr"],
                    username: "membre.actif",
                },
            } as unknown as PgBoss.Job<CreateOrUpdateMatomoAccountDataSchemaType>);

            const result = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("service_user_id", "=", "membre.actif@betagouv.ovh")
                .where("account_type", "=", "matomo")
                .executeTakeFirstOrThrow();
            result.status?.should.equal(ACCOUNT_SERVICE_STATUS.ACCOUNT_FOUND);
        });
    });

    describe("matomo account producer", () => {
        before(async () => {
            await utils.createUsers(testUsers);
        });
        after(async () => {
            await utils.deleteUsers(testUsers);
        });

        it("should create matomo worker tasks", async () => {
            const user = await db
                .selectFrom("users")
                .where("username", "=", "membre.actif")
                .selectAll()
                .executeTakeFirst();
            const mockSession = {
                user: {
                    id: "membre.actif",
                    isAdmin: false,
                    uuid: user?.uuid,
                },
            };
            let getServerSessionStub = sinon.stub();
            const askAccountCreationForService = proxyquire(
                "@/app/api/services/actions",
                {
                    "next-auth": { getServerSession: getServerSessionStub },
                }
            ).askAccountCreationForService;
            getServerSessionStub.resolves(mockSession);
            await askAccountCreationForService({
                service: SERVICES.MATOMO,
                data: {
                    sites: [
                        {
                            id: 1,
                        },
                    ],
                    newSite: {
                        url: "https://beta.gouv.fr",
                        type: MATOMO_SITE_TYPE.website,
                        startupId: "startupuuid",
                    },
                },
            });
            const account = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("user_id", "=", user?.uuid!)
                .where("account_type", "=", "matomo")
                .executeTakeFirstOrThrow();
            account.should.exist;
        });
    });

    describe("sentry account service consumer", () => {
        let service_accounts;
        let user;
        before(async function () {
            await utils.createUsers(testUsers);
            user = await db
                .selectFrom("users")
                .where("username", "=", "membre.actif")
                .selectAll()
                .executeTakeFirst();

            service_accounts = await db
                .insertInto("service_accounts")
                .values({
                    user_id: user.uuid,
                    email: "membre.actif@betagouv.ovh",
                    account_type: "sentry",
                    status: ACCOUNT_SERVICE_STATUS.ACCOUNT_CREATION_PENDING,
                })
                .executeTakeFirstOrThrow();
        });
        after(async function () {
            await db
                .deleteFrom("service_accounts")
                .where("uuid", "=", service_accounts.uuid)
                .executeTakeFirstOrThrow();
            await utils.deleteUsers(testUsers);
        });
        it("should create sentry service account", async () => {
            await createSentryServiceAccount({
                data: {
                    email: "membre.actif@betagouv.ovh",
                    userLogin: "membre.actif@betagouv.ovh",
                    username: "membre.actif",
                    userUuid: user?.uuid,
                    teams: [
                        {
                            teamSlug: "https://beta.gouv.fr",
                            role: "admin",
                        },
                    ],
                },
            } as unknown as PgBoss.Job<CreateSentryAccountDataSchemaType>);

            const result = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("user_id", "=", user?.uuid!)
                .where("account_type", "=", "sentry")
                .executeTakeFirstOrThrow();
            result.status?.should.equal(
                ACCOUNT_SERVICE_STATUS.ACCOUNT_INVITATION_SENT
            );
        });
    });

    describe("sentry account producer", () => {
        before(async () => {
            await utils.createUsers(testUsers);
        });
        after(async () => {
            await utils.deleteUsers(testUsers);
        });

        it("should create sentry worker tasks", async () => {
            const user = await db
                .selectFrom("users")
                .where("username", "=", "membre.actif")
                .selectAll()
                .executeTakeFirst();
            const mockSession = {
                user: {
                    id: "membre.actif",
                    isAdmin: false,
                    uuid: user?.uuid,
                },
            };
            let getServerSessionStub = sinon.stub();
            const askAccountCreationForService = proxyquire(
                "@/app/api/services/actions",
                {
                    "next-auth": { getServerSession: getServerSessionStub },
                }
            ).askAccountCreationForService;
            getServerSessionStub.resolves(mockSession);
            await askAccountCreationForService({
                service: SERVICES.SENTRY,
                data: {
                    teams: [
                        {
                            name: "beta.gouv.fr",
                        },
                    ],
                },
            });
            const account = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("user_id", "=", user?.uuid!)
                .where("account_type", "=", "sentry")
                .executeTakeFirstOrThrow();
            account.should.exist;
        });
    });
});
