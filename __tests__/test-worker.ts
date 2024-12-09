import PgBoss from "pg-boss";
import proxyquire from "proxyquire";
import sinon from "sinon";

import testUsers from "./users.json";
import utils from "./utils";
import { db } from "@/lib/kysely";
import { CreateMatomoAccountDataSchemaType } from "@/models/jobs/services";
import { ACCOUNT_SERVICE_STATUS, SERVICES } from "@/models/services";
import { createMatomoServiceAccount } from "@/server/queueing/workers/create-matomo-account";
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
            await createMatomoServiceAccount({
                data: {
                    email: "membre.actif@betagouv.ovh",
                    password: controllerUtils.encryptPassword("apassword"),
                    userLogin: "membre.actif@betagouv.ovh",
                    alias: "membre.actif@betagouv.ovh",
                    sites: ["https://beta.gouv.fr"],
                },
            } as unknown as PgBoss.Job<CreateMatomoAccountDataSchemaType>);

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
                            url: "beta.gouv.fr",
                        },
                    ],
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
});
