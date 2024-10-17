import chai from "chai";

import testUsers from "./users.json";
import utils from "./utils";
import { db } from "@/lib/kysely";
import config from "@/server/config";
import { FakeMatomo } from "@/server/config/matomo.config";
import { FakeSentryService } from "@/server/config/sentry.config";
import { syncMatomoAccounts } from "@/server/schedulers/serviceScheduler/syncMatomoAccounts";
import { syncSentryAccounts } from "@/server/schedulers/serviceScheduler/syncSentryAccounts";

const should = chai.should();

describe("Should sync services", () => {
    beforeEach(async () => {
        utils.cleanMocks();
        utils.mockOvhTime();
        await utils.createUsers(testUsers);
    });

    afterEach(async () => {
        // clock.restore();
        await utils.deleteUsers(testUsers);
    });
    describe("Matomo service", () => {
        it("should sync matomo users", async () => {
            const matomoClient = new FakeMatomo(
                [
                    {
                        login: `valid.member@${config.domain}`,
                        email: `valid.member@${config.domain}`,
                        alias: "",
                        superuser_access: "",
                        date_registered: "",
                    },
                    // membre qui n'existe pas, le compte devrait quand meme être sync
                    {
                        login: `membre.quinexistepas@${config.domain}`,
                        email: `membre.quinexistepas@${config.domain}`,
                        alias: "",
                        superuser_access: "",
                        date_registered: "",
                    },
                ],
                [
                    {
                        login: `valid.member@${config.domain}`,
                        site: 2,
                        access: "admin",
                    },
                ],
                [
                    {
                        idsite: 2,
                        name: "un super site",
                        main_url: "https://unsupersite.com",
                        type: "website",
                    },
                ]
            );
            await syncMatomoAccounts(matomoClient);
            const serviceAccount = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("service_user_id", "=", `valid.member@${config.domain}`)
                .executeTakeFirstOrThrow();
            if (!serviceAccount.metadata) {
                throw new Error("Service account should have metadata");
            }
            serviceAccount.metadata["sites"][0]["id"].should.equal(2);
            serviceAccount.metadata["sites"][0]["url"].should.equal(
                "https://unsupersite.com"
            );
            serviceAccount.metadata["sites"][0]["accessLevel"].should.equal(
                "admin"
            );
            const serviceAccountForNoCorrespondingValueInUserTable = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where(
                    "service_user_id",
                    "=",
                    `membre.quinexistepas@${config.domain}`
                )
                .executeTakeFirstOrThrow();
            serviceAccountForNoCorrespondingValueInUserTable.should.not.be.null;
            matomoClient.userAccess = [
                {
                    login: `valid.member@${config.domain}`,
                    site: 2,
                    access: "view", //access level changed
                },
            ];

            await syncMatomoAccounts(matomoClient);

            const serviceAccounts = await db
                .selectFrom("service_accounts")
                .selectAll()
                .execute();

            serviceAccounts.length.should.be.equals(2);

            const validMemberAccount = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("service_user_id", "=", `valid.member@${config.domain}`)
                .executeTakeFirstOrThrow();
            if (!serviceAccount.metadata) {
                throw new Error("Service account should have metadata");
            }
            // access level should have beem updated
            validMemberAccount.metadata["sites"][0]["accessLevel"].should.equal(
                "view"
            );
        });

        it("should delete matomo users in db if user does not exist anymore in matomo", async () => {
            const matomoClient = new FakeMatomo(
                [
                    {
                        login: `valid.member@${config.domain}`,
                        email: `valid.member@${config.domain}`,
                        alias: "",
                        superuser_access: "",
                        date_registered: "",
                    },
                    // membre qui n'existe pas, le compte devrait quand meme être sync
                    {
                        login: `membre.quinexistepas@${config.domain}`,
                        email: `membre.quinexistepas@${config.domain}`,
                        alias: "",
                        superuser_access: "",
                        date_registered: "",
                    },
                ],
                [
                    {
                        login: `valid.member@${config.domain}`,
                        site: 2,
                        access: "admin",
                    },
                ],
                [
                    {
                        idsite: 2,
                        name: "un super site",
                        main_url: "https://unsupersite.com",
                        type: "website",
                    },
                ]
            );
            await syncMatomoAccounts(matomoClient);

            // validMemberAccount should exist
            const validMemberAccount = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("service_user_id", "=", `valid.member@${config.domain}`)
                .executeTakeFirstOrThrow();
            validMemberAccount.should.exist;

            // membreQuiNexistePasAccount should existe
            const memberQuiNexistePasAccount = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where(
                    "service_user_id",
                    "=",
                    `membre.quinexistepas@${config.domain}`
                )
                .executeTakeFirstOrThrow();
            memberQuiNexistePasAccount.should.exist;

            // we removed validMember account from matomo
            matomoClient.users = [
                {
                    login: `membre.quinexistepas@${config.domain}`,
                    email: `membre.quinexistepas@${config.domain}`,
                    alias: "",
                    superuser_access: "",
                    date_registered: "",
                },
            ];

            // validMember account should be deleted during sync
            await syncMatomoAccounts(matomoClient);

            // validMember account should have been deleted from db
            const validMemberAccountAfterDeletion = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("service_user_id", "=", `valid.member@${config.domain}`)
                .executeTakeFirst();
            should.not.exist(validMemberAccountAfterDeletion);

            // membreQuiNexistePasAccount should still exist
            const memberQuiNexistePasAccountNotDeleted = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where(
                    "service_user_id",
                    "=",
                    `membre.quinexistepas@${config.domain}`
                )
                .executeTakeFirstOrThrow();
            memberQuiNexistePasAccountNotDeleted.should.exist;
        });
    });

    describe("Should sync sentry accounts", () => {
        it("should sync sentry users", async () => {
            const sentryClient = new FakeSentryService(
                [
                    {
                        id: "168",
                        email: `membre.actif@${config.domain}`,
                        name: "Membre Actif",
                    },
                    // membre qui n'existe pas, le compte devrait quand meme être sync
                    {
                        id: "sadadaeerr",
                        email: `membre.quinexistepas@${config.domain}`,
                    },
                ],
                [
                    {
                        id: "",
                        slug: "",
                        name: "",
                        memberCount: 0,
                        projects: [],
                    },
                ],
                [
                    {
                        id: "168",
                        user_id: "",
                        role: "admin",
                        email: `membre.actif@${config.domain}`,
                        name: "",
                        pending: false,
                        expired: false,
                        inviteStatus: "approved",
                        teams: ["monservicesecurise-prod", "nis2"],
                        teamRoles: [
                            { teamSlug: "monservicesecurise-prod", role: null },
                            { teamSlug: "nis2", role: null },
                        ],
                    },
                ]
            );
            await syncSentryAccounts(sentryClient);
            const serviceAccount = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("service_user_id", "=", "sadad")
                .executeTakeFirstOrThrow();
            if (!serviceAccount.metadata) {
                throw new Error("Service account should have metadata");
            }
            serviceAccount.metadata["teams"][0]["id"].should.equal(2);
            serviceAccount.metadata["teams"][0]["teamRoles"].should.equal(
                "admin"
            );
            const serviceAccountForNoCorrespondingValueInUserTable = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where(
                    "service_user_id",
                    "=",
                    `membre.quinexistepas@${config.domain}`
                )
                .executeTakeFirstOrThrow();
            serviceAccountForNoCorrespondingValueInUserTable.should.not.be.null;
            sentryClient.userAccess = [
                {
                    id: "168",
                    user_id: "",
                    role: "member",
                    email: `membre.actif@${config.domain}`,
                    name: "",
                    pending: false,
                    expired: false,
                    inviteStatus: "approved",
                    teams: ["monservicesecurise-prod", "nis2"],
                    teamRoles: [
                        { teamSlug: "monservicesecurise-prod", role: null },
                        { teamSlug: "nis2", role: null },
                    ],
                },
            ];
            await syncSentryAccounts(sentryClient);

            const serviceAccounts = await db
                .selectFrom("service_accounts")
                .selectAll()
                .execute();

            serviceAccounts.length.should.be.equals(2);
            const validMemberAccount = await db
                .selectFrom("service_accounts")
                .selectAll()
                .where("service_user_id", "=", `membre.actif@${config.domain}`)
                .executeTakeFirstOrThrow();
            if (!serviceAccount.metadata) {
                throw new Error("Service account should have metadata");
            }
            // access level should have beem updated
            validMemberAccount.metadata["teams"][0]["teamRoles"].should.equal(
                "view"
            );
        });
    });
});
