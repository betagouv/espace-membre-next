import utils from "./utils";
import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";
import config from "@/server/config";
import { FakeMatomo } from "@/server/config/matomo.config";
import { syncMatomoAccounts } from "@/server/schedulers/serviceScheduler/syncMatomoAccounts";

describe("Should sync service accounts", () => {
    let clock;
    let sendEmailStub;
    // beforeEach(async () => {
    //     return await utils.createUsers(users);
    // });

    // afterEach(async () => {
    //     await utils.deleteUsers(users);
    // });

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
                    idSite: 2,
                    name: "super site",
                    url: "https://supersite.com",
                    accessLevel: "admin",
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
        serviceAccount.metadata["sites"][0]["url"].should.equal(
            "https://supersite.com"
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
                idSite: 2,
                name: "super site",
                url: "https://supersite.com",
                accessLevel: "view", //access level changed
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
});
