import chai from "chai";

import { testUsers } from "./utils/users-data";
import utils from "./utils";
import { db } from "@/lib/kysely";
import { ACCOUNT_SERVICE_STATUS } from "@/models/services";
import config from "@/server/config";
import { FakeMatomo } from "@/server/config/matomo.config";
import { FakeSentryService } from "@/server/config/sentry.config";
import { syncMatomoAccounts } from "@/server/schedulers/serviceScheduler/syncMatomoAccounts";
import { syncSentryAccounts } from "@/server/schedulers/serviceScheduler/syncSentryAccounts";

const should = chai.should();

describe("Should sync services", () => {
  beforeEach(async () => {
    utils.cleanMocks();
    await utils.createData(testUsers);
    await db.deleteFrom("service_accounts").execute();
  });

  afterEach(async () => {
    // clock.restore();
    await utils.deleteData(testUsers);
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
        ],
      );
      await syncMatomoAccounts(matomoClient);
      const serviceAccount = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("account_type", "=", "matomo")
        .where("service_user_id", "=", `valid.member@${config.domain}`)
        .executeTakeFirstOrThrow();
      if (!serviceAccount.metadata) {
        throw new Error("Service account should have metadata");
      }
      serviceAccount.metadata["sites"][0]["id"].should.equal(2);
      serviceAccount.metadata["sites"][0]["url"].should.equal(
        "https://unsupersite.com",
      );
      serviceAccount.metadata["sites"][0]["accessLevel"].should.equal("admin");
      const serviceAccountForNoCorrespondingValueInUserTable = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("account_type", "=", "matomo")
        .where("service_user_id", "=", `membre.quinexistepas@${config.domain}`)
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
        .where("account_type", "=", "matomo")
        .execute();

      serviceAccounts.length.should.be.equals(2);

      const validMemberAccount = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("service_user_id", "=", `valid.member@${config.domain}`)
        .where("account_type", "=", "matomo")
        .executeTakeFirstOrThrow();
      if (!serviceAccount.metadata) {
        throw new Error("Service account should have metadata");
      }
      // access level should have beem updated
      validMemberAccount.metadata["sites"][0]["accessLevel"].should.equal(
        "view",
      );
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
          // membre qui n'existe pas en bdd, le compte devrait quand meme être sync
          {
            id: "169",
            email: `membre.quinexistepas@${config.domain}`,
          },
        ],
        [
          {
            id: "208",
            slug: "monservice-prod",
            name: "mon service prod",
            memberCount: 0,
            projects: [],
          },
          {
            id: "209",
            slug: "nis2",
            name: "nis2",
            memberCount: 0,
            projects: [],
          },
        ],
        [
          {
            id: "168",
            role: "admin",
            email: `membre.actif@${config.domain}`,
            name: "",
            pending: false,
            expired: false,
            inviteStatus: "approved",
            teams: ["monservice-prod", "nis2"],
            teamRoles: [
              { teamSlug: "monservice-prod", role: null },
              { teamSlug: "nis2", role: null },
            ],
          },
          {
            id: "169",
            role: "admin",
            email: `membre.quinexistepas@${config.domain}`,
            name: "",
            pending: true,
            expired: false,
            inviteStatus: "approved",
            teams: [],
            teamRoles: [],
          },
        ],
      );
      await syncSentryAccounts(sentryClient);
      const serviceAccount = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("service_user_id", "=", "168")
        .executeTakeFirstOrThrow();
      if (!serviceAccount.metadata) {
        throw new Error("Service account should have metadata");
      }
      serviceAccount.metadata["teams"][0]["slug"].should.equal(
        "monservice-prod",
      );
      serviceAccount.metadata["teams"][0]["role"].should.equal("admin");
      const serviceAccountForNoCorrespondingValueInUserTable = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("service_user_id", "=", `169`)
        .executeTakeFirstOrThrow();
      serviceAccountForNoCorrespondingValueInUserTable.should.not.be.null;
      sentryClient.userAccess = [
        {
          id: "168",
          role: "member",
          email: `membre.actif@${config.domain}`,
          name: "",
          pending: false,
          expired: false,
          inviteStatus: "approved",
          teams: ["monservice-prod", "nis2"],
          teamRoles: [
            { teamSlug: "monservice-prod", role: "contributor" },
            { teamSlug: "nis2", role: null },
          ],
        },
        {
          id: "169",
          role: "admin",
          email: `membre.quinexistepas@${config.domain}`,
          name: "",
          pending: true,
          expired: false,
          inviteStatus: "approved",
          teams: [],
          teamRoles: [],
        },
      ];
      await syncSentryAccounts(sentryClient);

      const serviceAccounts = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("account_type", "=", "sentry")
        .execute();

      serviceAccounts.length.should.be.equals(2);
      const validMemberAccount = await db
        .selectFrom("service_accounts")
        .selectAll()
        .where("service_user_id", "=", `168`)
        .where("account_type", "=", "sentry")
        .executeTakeFirstOrThrow();
      if (!serviceAccount.metadata) {
        throw new Error("Service account should have metadata");
      }
      // access level should have beem updated
      validMemberAccount.metadata["teams"][0]["slug"].should.equal(
        "monservice-prod",
      );
      validMemberAccount.metadata["teams"][0]["role"].should.equal(
        "contributor",
      );
    });
  });
});
