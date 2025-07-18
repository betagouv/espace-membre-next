import chai from "chai";
import { addDays } from "date-fns";
import nock from "nock";
import sinon from "sinon";

import utils from "./utils";
import { FakeDataInterface } from "./utils/fakeData";
import { db } from "@/lib/kysely";
import { EmailStatusCode, Domaine } from "@/models/member";
import config from "@/server/config";
import * as email from "@/server/config/email.config";
import { FakeMatomo, matomoClient } from "@/server/config/matomo.config";
import { FakeSentryService } from "@/server/config/sentry.config";
import BetaGouv from "@betagouv";
import { setEmailExpired } from "@schedulers/setEmailExpired";
import {
  sendInfoToSecondaryEmailAfterXDays,
  deleteSecondaryEmailsForUsers,
  deleteOVHEmailAcounts,
  removeEmailsFromMailingList,
  deleteRedirectionsAfterQuitting,
  deleteMatomoAccount,
  deleteServiceAccounts,
} from "@schedulers/userContractEndingScheduler";

const should = chai.should();
const fakeTodayDate = new Date("2020-01-01T09:59:59+01:00");
const expiredFor1dayDate = new Date("2019-12-31");
const expiredFor15daysDate = new Date("2020-01-16");
const willExpireIn30daysDate = new Date("2020-01-31");
const expiredFor30daysDate = new Date("2019-12-02");
const expiredFor31daysDate = new Date("2019-12-01");

const betaGouvUsers: FakeDataInterface = {
  users: [
    {
      username: "membre.actif",
      fullname: "Membre Actif",
      missions: [
        {
          start: new Date("2016-11-03"),
          end: addDays(new Date(), 400),
          status: "independent",
          employer: "octo",
        },
      ],
    },
    {
      username: "membre.expire",
      fullname: "Membre Expiré",
      missions: [
        {
          start: new Date("2016-11-03"),
          end: new Date("2017-11-02"),
          status: "independent",
          employer: "octo",
        },
      ],
    },
    {
      username: "membre.quipart",
      fullname: "membre quipart",
      github: "test-github",
      primary_email: "membre.quipart@modernisation.gouv.fr",
      missions: [
        {
          start: new Date("2016-11-03"),
          end: expiredFor15daysDate,
          status: "independent",
          employer: "octo",
        },
      ],
    },
    {
      username: "membre.quipart.30days",
      fullname: "membre quipart",
      github: "test-github",
      domaine: Domaine.DEVELOPPEMENT,
      primary_email: `membre.quipart.30days@${config.domain}`,
      missions: [
        {
          start: new Date("2016-11-03"),
          end: willExpireIn30daysDate,
          status: "independent",
          employer: "octo",
        },
      ],
    },
  ],
};

const mattermostUsers = [
  {
    id: "membre.actif",
    email: `membre.actif@${config.domain}`,
    username: "membreactif",
  },
  {
    id: "julien.dauphant",
    email: `julien.dauphant@${config.domain}`,
    username: "julien.dauphant",
  },
  {
    id: "membre.quipart",
    email: `membre.quipart@modernisation.gouv.fr`,
    username: "membre.quipart",
  },
  {
    id: "countdoesnotexist",
    email: `countdoesnotexist@${config.domain}`,
  },
  {
    id: "membre.quipart.30days",
    username: "membre.quipart.30days",
    email: `membre.quipart.30days@${config.domain}`,
  },
];

const userContractEndingScheduler = require("@schedulers/userContractEndingScheduler");

describe("send message on contract end to user", () => {
  let chat;
  let clock;
  let sendEmailStub;
  // let jobsStub;
  beforeEach(async () => {
    utils.cleanMocks();
    utils.mockSlackGeneral();
    utils.mockSlackSecretariat();
    utils.mockOvhTime();
    utils.mockOvhRedirections();
    utils.mockOvhUserResponder();
    utils.mockOvhUserEmailInfos();
    utils.mockOvhAllEmailInfos();
    sendEmailStub = sinon
      .stub(email, "sendEmail")
      .returns(Promise.resolve(null));
    chat = sinon.spy(BetaGouv, "sendInfoToChat");
    clock = sinon.useFakeTimers(new Date(fakeTodayDate));
    nock(
      "https://mattermost.incubateur.net/^.*api/v4/users?per_page=200&page=0",
    )
      .get(/.*/)
      .reply(200, [...mattermostUsers]);
    nock(
      "https://mattermost.incubateur.net/^.*api/v4/users?per_page=200&page=1",
    )
      .get(/.*/)
      .reply(200, []);
    await utils.createData(betaGouvUsers);
  });

  afterEach(async () => {
    chat.restore();
    clock.restore();
    sendEmailStub.restore();
    // jobsStub.restore();
    utils.cleanMocks();
    await utils.deleteData(betaGouvUsers);
  });

  it("should send message to users for j-15", async () => {
    const { sendContractEndingMessageToUsers } = userContractEndingScheduler;
    await sendContractEndingMessageToUsers("mail15days", true);
    chat.calledOnce.should.be.true;
    chat.firstCall.args[2].should.be.equal("membre.quipart");
    sendEmailStub.firstCall.args[0] =
      "membre.quipart@modernisation.gouv.fr,membre.emailsecondary@gmail.com";
  });

  it("should send message to users for j-30", async () => {
    const { sendContractEndingMessageToUsers } = userContractEndingScheduler;
    try {
      await sendContractEndingMessageToUsers("mail30days", true);
    } catch (e) {
      console.log(e);
    }
    chat.calledOnce.should.be.true;
    chat.firstCall.args[2].should.be.equal("membre.quipart.30days");
    sendEmailStub.firstCall.args[0] =
      "membre.quipart@modernisation.gouv.fr,membre.emailsecondary@gmail.com";
  });
  describe("Test sending j+x day email", () => {
    const users: FakeDataInterface = {
      users: [
        {
          secondary_email: "uneadressesecondaire@gmail.com",
          username: "julien.dauphant",
          fullname: "Julien Dauphant",
          role: "",
          domaine: Domaine.ANIMATION,
          missions: [
            {
              start: new Date("2016-11-03"),
              end: expiredFor1dayDate,
              status: "independent",
              employer: "octo",
            },
          ],
        },
      ],
    };
    beforeEach(async () => {
      await utils.createData(users);
    });
    afterEach(async () => {
      await utils.deleteData(users);
    });
    it("should send j1 mail to users", async () => {
      await sendInfoToSecondaryEmailAfterXDays(1);
      sendEmailStub.calledOnce.should.be.true;
    });

    it("should delete user ovh account if email status suspended for more than 30 days", async () => {
      const updatedUser = await db
        .updateTable("users")
        .where("username", "=", "membre.expire")
        .set({
          primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
          primary_email_status_updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await db
        .updateTable("missions")
        .where("user_id", "=", updatedUser.uuid)
        .set({
          end: expiredFor30daysDate,
        })
        .execute();
      const ovhEmailDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/account\/membre.expire/)
        .reply(200);
      await deleteOVHEmailAcounts();
      ovhEmailDeletion.isDone().should.be.false;
      const today = new Date();
      const todayLess30days = new Date();
      todayLess30days.setDate(today.getDate() - 31);
      await db
        .updateTable("users")
        .where("username", "=", "membre.expire")
        .set({
          primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
          primary_email_status_updated_at: todayLess30days,
        })
        .execute();
      await deleteOVHEmailAcounts();
      const user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.expire")
        .executeTakeFirstOrThrow();
      user.primary_email_status.should.be.equal(EmailStatusCode.EMAIL_DELETED);
      ovhEmailDeletion.isDone().should.be.true;
    });

    it("should not delete user secondary_email if suspended less than 30days", async () => {
      const today = new Date();
      const todayLess29days = new Date();
      todayLess29days.setDate(today.getDate() - 29);
      const updatedUser = await db
        .updateTable("users")
        .where("username", "=", "julien.dauphant")
        .set({
          primary_email_status: EmailStatusCode.EMAIL_DELETED,
          primary_email_status_updated_at: todayLess29days,
          secondary_email: "uneadressesecondaire@gmail.com",
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await db
        .updateTable("missions")
        .where("user_id", "=", updatedUser.uuid)
        .set({
          end: expiredFor30daysDate,
        })
        .execute();
      const [user1] = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "julien.dauphant")
        .execute();
      should.equal(user1.secondary_email, "uneadressesecondaire@gmail.com");

      await db
        .updateTable("users")
        .where("username", "=", "julien.dauphant")
        .set({
          primary_email_status: EmailStatusCode.EMAIL_DELETED,
          primary_email_status_updated_at: new Date(expiredFor31daysDate),
          secondary_email: "uneadressesecondaire@gmail.com",
        })
        .execute();
      await deleteSecondaryEmailsForUsers();
      const [user2] = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "julien.dauphant")
        .execute();
      should.equal(user2.secondary_email, null);
    });

    it("should delete user secondary_email if suspended more than 30days", async () => {
      const updatedUser = await db
        .updateTable("users")
        .where("username", "=", "julien.dauphant")
        .set({
          primary_email_status: EmailStatusCode.EMAIL_DELETED,
          primary_email_status_updated_at: new Date(expiredFor31daysDate),
          secondary_email: "uneadressesecondaire@gmail.com",
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await db
        .updateTable("missions")
        .where("user_id", "=", updatedUser.uuid)
        .set({
          end: expiredFor30daysDate,
        })
        .execute();
      await deleteSecondaryEmailsForUsers();
      const [user2] = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "julien.dauphant")
        .execute();
      should.equal(user2.secondary_email, null);
      await db
        .updateTable("users")
        .where("username", "=", "julien.dauphant")
        .set({
          secondary_email: null,
        })
        .execute();
    });
  });
});

describe("After quitting", () => {
  let clock;
  let sendEmailStub;
  let users: FakeDataInterface = {
    users: [
      {
        username: "julien.dauphant",
        fullname: "Julien Dauphant",
        missions: [
          {
            start: new Date("2016-11-03"),
            end: expiredFor1dayDate,
            status: "independent",
            employer: "octo",
          },
        ],
      },
      {
        username: "julien.dauphant2",
        fullname: "Julien Dauphant",
        missions: [
          {
            start: new Date("2016-11-03"),
            end: expiredFor30daysDate,
            status: "independent",
            employer: "octo",
          },
        ],
      },
    ],
  };
  beforeEach(async () => {
    utils.cleanMocks();
    utils.mockSlackGeneral();
    utils.mockSlackSecretariat();
    utils.mockOvhTime();
    utils.mockOvhRedirections();
    utils.mockOvhUserResponder();
    utils.mockOvhUserEmailInfos();
    utils.mockOvhAllEmailInfos();
    sendEmailStub = sinon
      .stub(email, "sendEmail")
      .returns(Promise.resolve(null));
    clock = sinon.useFakeTimers(new Date(fakeTodayDate));
    await utils.createData(users);
  });

  afterEach(async () => {
    clock.restore();
    sendEmailStub.restore();
    utils.cleanMocks();
    await utils.deleteData(users);
  });

  it("should delete users redirections at j+1", async () => {
    const test: unknown[] = await deleteRedirectionsAfterQuitting();
    should.equal(test.length, 1);
  });

  it("should delete redirections even for past users", async () => {
    const test: unknown[] = await deleteRedirectionsAfterQuitting(true);
    should.equal(test.length, 2);
  });

  it("should delete redirections even for past users", async () => {
    const test: unknown[] = await deleteRedirectionsAfterQuitting(true);
    should.equal(test.length, 2);
  });

  it("should set email as expired if email is not from main domain", async () => {
    const updatedUser = await db
      .updateTable("users")
      .where("username", "=", "julien.dauphant")
      .set({
        primary_email: `julien.dauphant@${config.domain}`,
        primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
        primary_email_status_updated_at: expiredFor31daysDate,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await db
      .updateTable("missions")
      .where("user_id", "=", updatedUser.uuid)
      .set({
        start: "2018-01-01",
        end: new Date(expiredFor31daysDate).toISOString().split("T")[0],
      })
      .execute();
    await setEmailExpired();
    const [user] = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", "julien.dauphant")
      .execute();
    user.primary_email_status.should.equal(EmailStatusCode.EMAIL_SUSPENDED);

    const updatedUser2 = await db
      .updateTable("users")
      .where("username", "=", "julien.dauphant")
      .set({
        primary_email: `julien.dauphant@anotherdomain.com`,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await setEmailExpired();
    const [user2] = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", "julien.dauphant")
      .execute();
    user2.primary_email_status.should.equal(EmailStatusCode.EMAIL_EXPIRED);
    // userinfos.restore();
  });

  it("should remove user from mailingList", async () => {
    const url = process.env.USERS_API || "https://beta.gouv.fr";
    nock(url)
      .get((uri) => uri.includes("authors.json"))
      .reply(200, [
        {
          id: "julien.dauphant",
          fullname: "Julien Dauphant",
          missions: [
            {
              start: "2016-11-03",
              end: expiredFor30daysDate,
              status: "independent",
              employer: "octo",
            },
          ],
        },
      ])
      .persist();
    const ovhMailingList = nock(/.*ovh.com/)
      .get(/^.*email\/domain\/.*\/mailingList\//)
      .reply(200, ["beta-gouv-fr", "aides-jeunes"]);
    const mailingListBeta = nock(/.*ovh.com/)
      .delete((uri) =>
        uri.includes(
          `/email/domain/${config.domain}/mailingList/beta-gouv-fr/subscriber/julien.dauphant2@${config.domain}`,
        ),
      )
      .reply(404);
    const mailingListAideJeune = nock(/.*ovh.com/)
      .delete((uri) =>
        uri.includes(
          `/email/domain/${config.domain}/mailingList/aides-jeunes/subscriber/julien.dauphant2@${config.domain}`,
        ),
      )
      .reply(200, {
        action: "mailinglist/deleteSubscriber",
        id: 14564515,
        language: "fr",
        domain: config.domain,
        account: "aides-jeunes",
        date: "2021-08-12T15:29:55+02:00",
      });
    await removeEmailsFromMailingList();
    ovhMailingList.isDone().should.be.true;
    mailingListBeta.isDone().should.be.true;
    mailingListAideJeune.isDone().should.be.true;
  });

  it("should delete matomo user account for expired users", async () => {
    const matomoClient = new FakeMatomo([
      {
        login: `valid.member@${config.domain}`,
        email: `valid.member@${config.domain}`,
        alias: "",
        superuser_access: "",
        date_registered: "",
      },
      // membre expiré
      {
        login: `julien.dauphant2@${config.domain}`,
        email: `julien.dauphant2@${config.domain}`,
        alias: "",
        superuser_access: "",
        date_registered: "",
      },
    ]);
    await db
      .updateTable("users")
      .where("username", "=", "julien.dauphant2")
      .set({
        primary_email: `julien.dauphant2@${config.domain}`,
        primary_email_status: EmailStatusCode.EMAIL_DELETED,
        primary_email_status_updated_at: expiredFor31daysDate,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await deleteServiceAccounts(matomoClient);
    const users = await matomoClient.getAllUsers();
    users.length.should.equals(1);
    users[0].user.email.should.equals(`valid.member@${config.domain}`);
  });

  it("should delete matomo user account for expired users when login and email are not the same", async () => {
    const matomoClient = new FakeMatomo([
      {
        login: `valid.member`,
        email: `valid.member@${config.domain}`,
        alias: "",
        superuser_access: "",
        date_registered: "",
      },
      // membre expiré
      {
        login: `julien.dauphant2`,
        email: `julien.dauphant2@${config.domain}`,
        alias: "",
        superuser_access: "",
        date_registered: "",
      },
    ]);
    await db
      .updateTable("users")
      .where("username", "=", "julien.dauphant2")
      .set({
        primary_email: `julien.dauphant2@${config.domain}`,
        primary_email_status: EmailStatusCode.EMAIL_DELETED,
        primary_email_status_updated_at: expiredFor31daysDate,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await deleteServiceAccounts(matomoClient);
    const users = await matomoClient.getAllUsers();
    users.length.should.equals(1);
    users[0].user.email.should.equals(`valid.member@${config.domain}`);
  });

  it("should delete sentry user account for expired users", async () => {
    const sentryClient = new FakeSentryService([
      {
        email: `valid.member@${config.domain}`,
        id: "sdasda554",
      },
      // membre expiré
      {
        email: `julien.dauphant2@${config.domain}`,
        id: "54sdadadsa",
      },
    ]);
    const updatedUser = await db
      .updateTable("users")
      .where("username", "=", "julien.dauphant2")
      .set({
        primary_email: `julien.dauphant2@${config.domain}`,
        primary_email_status: EmailStatusCode.EMAIL_DELETED,
        primary_email_status_updated_at: expiredFor31daysDate,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    await deleteServiceAccounts(sentryClient);
    const users = await sentryClient.getAllUsers();
    users.length.should.equals(1);
    users[0].user.email.should.equals(`valid.member@${config.domain}`);
  });
});
