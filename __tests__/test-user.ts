import chai from "chai";
import chaiHttp from "chai-http";
import { addDays } from "date-fns";
import * as nextAuth from "next-auth/next";
import nock from "nock";
import proxyquire from "proxyquire";
import sinon from "sinon";

import utils from "./utils";
import { FakeDataInterface } from "./utils/fakeData";
import { testUsers } from "./utils/users-data";
//import { createEmail as createEmailAction } from "@/app/api/member/actions/createEmailForUser";
import { createRedirectionForUser } from "@/app/api/member/actions/createRedirectionForUser";
import { deleteRedirectionForUser } from "@/app/api/member/actions/deleteRedirectionForUser";
import { updatePasswordForUser } from "@/app/api/member/actions/updatePasswordForUser";
import { db } from "@/lib/kysely";
import * as mattermost from "@/lib/mattermost";
import { Domaine, EmailStatusCode } from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import config from "@/server/config";
import { createEmail } from "@/server/controllers/usersController/createEmailForUser";
import * as session from "@/server/helpers/session";
import betagouv from "@betagouv";
import Betagouv from "@betagouv";
import * as controllerUtils from "@controllers/utils";
import {
  //createEmailAddresses,
  //createRedirectionEmailAdresses,
  subscribeEmailAddresses,
  unsubscribeEmailAddresses,
} from "@schedulers/emailScheduler";

chai.use(chaiHttp);
const { expect } = chai;

describe("Test user relative actions", () => {
  let ovhPasswordNock;

  // describe("test createEmailAction unauthenticated", () => {
  //   let getServerSessionStub;
  //   let isPublicServiceEmailStub;
  //   let user;

  //   beforeEach(async () => {
  //     isPublicServiceEmailStub = sinon
  //       .stub(controllerUtils, "isPublicServiceEmail")
  //       .returns(Promise.resolve(true));
  //     getServerSessionStub = sinon
  //       .stub(nextAuth, "getServerSession")
  //       .resolves({});

  //     await utils.createData(testUsers);
  //     user = await db
  //       .selectFrom("users")
  //       .selectAll()
  //       .where("username", "=", "membre.actif")
  //       .executeTakeFirstOrThrow();
  //   });
  //   afterEach(async () => {
  //     sinon.restore();
  //     await utils.deleteData(testUsers);
  //     isPublicServiceEmailStub.restore();
  //   });

  //   it("should return an Unauthorized error", async () => {
  //     try {
  //       await createEmailAction({
  //         username: "membre.parti",
  //         to_email: "lucas.charr@test.com",
  //       });
  //     } catch (err) {
  //       expect(err).to.be.an("error");
  //     }
  //     // chai.request(app)
  //     //     .post(
  //     //         routes.USER_CREATE_EMAIL_API.replace(
  //     //             ":username",
  //     //             "membre.parti"
  //     //         )
  //     //     )
  //     //     .type("form")
  //     //     .send({
  //     //         _method: "POST",
  //     //     })
  //     //     .end((err, res) => {
  //     // res.should.have.status(401);
  //     //     done();
  //     // });
  //   });
  // });
  // describe("test createEmailAction authenticated", () => {
  //   let getServerSessionStub;
  //   let isPublicServiceEmailStub;
  //   let user;

  //   beforeEach(async () => {
  //     isPublicServiceEmailStub = sinon
  //       .stub(controllerUtils, "isPublicServiceEmail")
  //       .returns(Promise.resolve(true));
  //     getServerSessionStub = sinon
  //       .stub(nextAuth, "getServerSession")
  //       .resolves({});

  //     await utils.createData(testUsers);
  //     user = await db
  //       .selectFrom("users")
  //       .selectAll()
  //       .where("username", "=", "membre.actif")
  //       .executeTakeFirstOrThrow();
  //   });
  //   afterEach(async () => {
  //     sinon.restore();
  //     await utils.deleteData(testUsers);
  //     isPublicServiceEmailStub.restore();
  //   });

  //   it("should ask OVH to create an email", async () => {
  //     const mockSession = {
  //       user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
  //     };
  //     getServerSessionStub.resolves(mockSession);
  //     const ovhEmailCreation = nock(/.*ovh.com/)
  //       .post(/^.*email\/domain\/.*\/account/)
  //       .reply(200);
  //     await db
  //       .updateTable("users")
  //       .where("username", "=", "membre.nouveau@beta.gouv.fr")
  //       .set({
  //         primary_email: null,
  //       })
  //       .execute();

  //     try {
  //       await createEmailAction({
  //         username: "membre.nouveau",
  //         to_email: "membre.nouveau@beta.gouv.fr",
  //       });
  //     } catch (err) {
  //       expect(err).to.be.an("error");
  //     }

  //     const res = await db
  //       .selectFrom("users")
  //       .selectAll()
  //       .where("username", "=", "membre.nouveau")
  //       .executeTakeFirst();
  //     res.primary_email.should.equal(`membre.nouveau@${config.domain}`);
  //     ovhEmailCreation.isDone().should.be.true;
  //   });

  //   it("should not allow email creation from delegate if email already exists", async () => {
  //     // For this case we need to reset the basic nocks in order to return
  //     // a different response to indicate that membre.nouveau has an
  //     // existing email already created.
  //     utils.cleanMocks();
  //     utils.mockSlackGeneral();
  //     utils.mockSlackSecretariat();
  //     utils.mockOvhTime();
  //     utils.mockOvhRedirections();

  //     const mockSession = {
  //       user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
  //     };
  //     getServerSessionStub.resolves(mockSession);

  //     // We return an email for membre.nouveau to indicate he already has one
  //     nock(/.*ovh.com/)
  //       .get(/^.*email\/domain\/.*\/account\/.*/)
  //       .reply(200, {
  //         accountName: "membre.nouveau",
  //         email: "membre.nouveau@example.com",
  //       });

  //     const ovhEmailCreation = nock(/.*ovh.com/)
  //       .post(/^.*email\/domain\/.*\/account/)
  //       .reply(200);
  //     try {
  //       await createEmailAction({
  //         username: "membre.nouveau",
  //         to_email: "membre.nouveau@example.com",
  //       });
  //     } catch (err) {
  //       ovhEmailCreation.isDone().should.be.false;
  //     }
  //   });

  //   it("should not allow email creation from delegate if github file doesn't exist", async () => {
  //     const mockSession = {
  //       user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
  //     };
  //     getServerSessionStub.resolves(mockSession);
  //     const ovhEmailCreation = nock(/.*ovh.com/)
  //       .post(/^.*email\/domain\/.*\/account/)
  //       .reply(200);
  //     try {
  //       await createEmailAction({
  //         username: "membre.sans.fiche",
  //         to_email: "membre.nouveau@example.com",
  //       });
  //     } catch (err) {
  //       ovhEmailCreation.isDone().should.be.false;
  //     }
  //   });

  //   it("should not allow email creation from delegate if user has expired", async () => {
  //     const mockSession = {
  //       user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
  //     };
  //     getServerSessionStub.resolves(mockSession);
  //     const ovhEmailCreation = nock(/.*ovh.com/)
  //       .post(/^.*email\/domain\/.*\/account/)
  //       .reply(200);

  //     try {
  //       await createEmailAction({
  //         username: "membre.expire",
  //         to_email: "membre.nouveau@example.com",
  //       });
  //     } catch (err) {
  //       ovhEmailCreation.isDone().should.be.false;
  //     }
  //   });

  //   it("should not allow email creation from delegate if delegate has expired", async () => {
  //     const mockSession = {
  //       user: { id: "membre.expire", isAdmin: false, uuid: user.uuid },
  //     };
  //     getServerSessionStub.resolves(mockSession);
  //     const ovhEmailCreation = nock(/.*ovh.com/)
  //       .post(/^.*email\/domain\/.*\/account/)
  //       .reply(200);

  //     try {
  //       await createEmailAction({
  //         username: "membre.nouveau",
  //         to_email: "membre.nouveau@example.com",
  //       });
  //     } catch (err) {
  //       ovhEmailCreation.isDone().should.be.false;
  //     }
  //   });

  //   it("should allow email creation from delegate if user is active", async () => {
  //     const mockSession = {
  //       user: {
  //         id: "julien.dauphant",
  //         isAdmin: false,
  //         uuid: user.uuid,
  //       },
  //     };
  //     getServerSessionStub.resolves(mockSession);

  //     const ovhEmailCreation = nock(/.*ovh.com/)
  //       .post(/^.*email\/domain\/.*\/account/)
  //       .reply(200);
  //     await db
  //       .updateTable("users")
  //       .where("username", "=", "membre.actif")
  //       .set({
  //         primary_email: null,
  //       })
  //       .execute();
  //     await createEmailAction({
  //       username: "membre.actif",
  //       to_email: "membre.nouveau@example.com",
  //     });

  //     ovhEmailCreation.isDone().should.be.true;
  //     const user2 = await db
  //       .selectFrom("users")
  //       .selectAll()
  //       .where("username", "=", "membre.actif")
  //       .executeTakeFirstOrThrow();
  //   });
  //});

  describe("Create redirection unauthenticated", () => {
    it("should return an Unauthorized error", async () => {
      try {
        await createRedirectionForUser({
          username: "membre.actif",
          to_email: "toto@gmail.com",
        });
      } catch (err) {
        expect(err).to.be.an("error");
      }
    });
  });

  describe("Create redirection authenticated", () => {
    let getServerSessionStub;
    let isPublicServiceEmailStub;
    let user;

    beforeEach(async () => {
      isPublicServiceEmailStub = sinon
        .stub(controllerUtils, "isPublicServiceEmail")
        .returns(Promise.resolve(true));
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      await utils.createData(testUsers);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.actif")
        .executeTakeFirstOrThrow();
    });
    afterEach(async () => {
      sinon.restore();
      await utils.deleteData(testUsers);
      isPublicServiceEmailStub.restore();
      await utils.deleteData(testUsers);
    });

    it("should ask OVH to create a redirection", async () => {
      const mockSession = {
        user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);

      isPublicServiceEmailStub.returns(Promise.resolve(true));

      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      await createRedirectionForUser({
        to_email: "test@example.com",
        username: "membre.actif",
      });

      ovhRedirectionCreation.isDone().should.be.true;
    });

    it("should not allow redirection creation from delegate", async () => {
      const mockSession = {
        user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);
      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);

      try {
        await createRedirectionForUser({
          to_email: "test@example.com",
          username: "membre.nouveau",
        });
      } catch (e) {
        ovhRedirectionCreation.isDone().should.be.false;
      }
    });

    it("should not allow redirection creation from expired users", async () => {
      const ovhRedirectionCreation = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/redirection/)
        .reply(200);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.expire")
        .executeTakeFirstOrThrow();
      const mockSession = {
        user: { id: "membre.expire", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);
      try {
        await createRedirectionForUser({
          to_email: "test@example.com",
          username: "membre.expire",
        });
      } catch (e) {
        ovhRedirectionCreation.isDone().should.be.false;
      }
    });
  });

  describe("Delete redirections unauthenticated", () => {
    let getServerSessionStub;

    beforeEach(async () => {
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      await utils.createData(testUsers);
    });
    afterEach(async () => {
      sinon.restore();
      await utils.deleteData(testUsers);
    });
    it("should return an Unauthorized error", async () => {
      try {
        await deleteRedirectionForUser({
          username: "membre.parti",
          toEmail: "",
        });
      } catch (e) {
        console.log(e);
      }
    });
  });

  describe("Delete redirections authenticated", () => {
    let getServerSessionStub;
    let isPublicServiceEmailStub;
    let user;

    beforeEach(async () => {
      isPublicServiceEmailStub = sinon
        .stub(controllerUtils, "isPublicServiceEmail")
        .returns(Promise.resolve(true));
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      await utils.createData(testUsers);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.actif")
        .executeTakeFirstOrThrow();
    });
    afterEach(async () => {
      sinon.restore();
      await utils.deleteData(testUsers);
      isPublicServiceEmailStub.restore();
    });

    it("should ask OVH to delete a redirection", async () => {
      const mockSession = {
        user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);

      await deleteRedirectionForUser({
        username: "membre.actif",
        toEmail: "test-2@example.com",
      });
      ovhRedirectionDeletion.isDone().should.be.true;
    });

    it("should not allow redirection deletion from delegate", async () => {
      const mockSession = {
        user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);
      try {
        await deleteRedirectionForUser({
          username: "membre.nouveau",
          toEmail: "test-2@example.com",
        });
      } catch (e) {
        ovhRedirectionDeletion.isDone().should.be.false;
      }
    });

    it("should not allow redirection deletion from expired users", async () => {
      const ovhRedirectionDeletion = nock(/.*ovh.com/)
        .delete(/^.*email\/domain\/.*\/redirection\/.*/)
        .reply(200);
      const mockSession = {
        user: { id: "membre.expire", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);

      try {
        await deleteRedirectionForUser({
          username: "membre.expire",
          toEmail: "test-2@example.com",
        });
      } catch (e) {
        ovhRedirectionDeletion.isDone().should.be.false;
      }
    });
  });

  describe("Test update password server action unauthenticated", () => {
    beforeEach(async () => {
      await utils.createData(testUsers);
    });

    afterEach(async () => {
      // getToken.restore();
      await utils.deleteData(testUsers);
    });

    it("should return an Unauthorized error", async () => {
      try {
        await updatePasswordForUser({
          username: "membre.actif",
          new_password: "Test_Password_1234",
        });
      } catch (e) {
        expect(e).to.be.an("error");
      }
    });
    it("should not allow a password change", async () => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      try {
        await updatePasswordForUser({
          new_password: "Test_Password_1234",
          username: "membre.actif",
        });
      } catch (e) {
        ovhPasswordNock.isDone().should.be.false;
      }
    });
  });

  describe("Test update password server action authenticated", () => {
    let getServerSessionStub;
    let isPublicServiceEmailStub;
    let user;

    beforeEach(async () => {
      isPublicServiceEmailStub = sinon
        .stub(controllerUtils, "isPublicServiceEmail")
        .returns(Promise.resolve(true));
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      await utils.createData(testUsers);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.actif")
        .executeTakeFirstOrThrow();
    });
    afterEach(async () => {
      sinon.restore();
      await utils.deleteData(testUsers);
      isPublicServiceEmailStub.restore();
      await utils.deleteData(testUsers);
    });

    it("should send error if user does not exist", async () => {
      const mockSession = {
        user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);
      try {
        await updatePasswordForUser({
          new_password: "Test_Password_1234",
          username: "membre.onthetom",
        });
      } catch (e) {
        expect(e).to.be.an("error");
      }
      // res.header.location.should.equal("/community/membre.actif");
      // done();
      // });
    });
    it("should perform a password change if the email exists", async () => {
      utils.cleanMocks();
      utils.mockOvhUserResponder();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      const mockSession = {
        user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);
      const username = "membre.actif";
      await db
        .updateTable("users")
        .where("username", "=", username)
        .set({ primary_email_status: EmailStatusCode.EMAIL_ACTIVE })
        .execute();
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, {
          accountName: username,
          email: "membre.actif@example.com",
        })
        .persist();

      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);
      try {
        await updatePasswordForUser({
          username,
          new_password: "Test_Password_1234",
        });
      } catch (e) {
        expect(e).to.be.an("error");
      }
      ovhPasswordNock.isDone().should.be.true;
    });
    it("should perform a password change and pass status to active if status was suspended", async () => {
      utils.cleanMocks();
      utils.mockOvhUserResponder();
      utils.mockSlackGeneral();
      utils.mockSlackSecretariat();
      utils.mockOvhTime();
      utils.mockOvhRedirections();
      const username = "membre.actif";
      const mockSession = {
        user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);
      await db
        .updateTable("users")
        .where("username", "=", username)
        .set({
          primary_email_status: EmailStatusCode.EMAIL_SUSPENDED,
        })
        .execute();
      nock(/.*ovh.com/)
        .get(/^.*email\/domain\/.*\/account\/.*/)
        .reply(200, {
          accountName: username,
          email: "membre.actif@example.com",
        })
        .persist();

      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);
      await updatePasswordForUser({
        new_password: "Test_Password_1234",
        username: username,
      });

      ovhPasswordNock.isDone().should.be.true;
      const user2 = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", username)
        .executeTakeFirstOrThrow();
      user2.primary_email_status.should.be.equal(EmailStatusCode.EMAIL_ACTIVE);
    });

    it("should not allow a password change from delegate", async () => {
      const mockSession = {
        user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);

      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);
      try {
        await updatePasswordForUser({
          new_password: "Test_Password_1234",
          username: "membre.nouveau",
        });
      } catch (e) {
        expect(e).to.be.an("error");
      }
    });
    it("should not allow a password change from expired user", async () => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.expire")
        .executeTakeFirstOrThrow();
      const mockSession = {
        user: { id: "membre.expire", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);

      try {
        await updatePasswordForUser({
          new_password: "Test_Password_1234",
          username: "membre.expire",
        });
      } catch (e) {
        ovhPasswordNock.isDone().should.be.false;
      }
    });
    it("should not allow a password shorter than 9 characters", async () => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);
      const mockSession = {
        user: { id: "membre.actif", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);
      try {
        await updatePasswordForUser({
          new_password: "12345678",
          username: "membre.actif",
        });
      } catch (e) {
        ovhPasswordNock.isDone().should.be.false;
      }
    });
    it("should not allow a password longer than 30 characters", async () => {
      ovhPasswordNock = nock(/.*ovh.com/)
        .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
        .reply(200);

      try {
        await updatePasswordForUser({
          new_password: "1234567890123456789012345678901",
          username: "membre.actif",
        });
      } catch (e) {
        ovhPasswordNock.isDone().should.be.false;
      }
    });
  });

  describe("Test manage secondary email", () => {
    let isPublicServiceEmailStub;
    let getServerSessionStub;
    let user;
    const manageSecondaryEmailForUser = proxyquire(
      "@/app/api/member/actions/index",
      {
        "next/cache": {
          revalidatePath: sinon.stub(),
        },
      },
    ).manageSecondaryEmailForUser;

    beforeEach(async () => {
      isPublicServiceEmailStub = sinon
        .stub(controllerUtils, "isPublicServiceEmail")
        .returns(Promise.resolve(true));
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      await utils.createData(testUsers);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .executeTakeFirstOrThrow();
      const mockSession = {
        user: { id: "membre.nouveau", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);
    });
    afterEach(async () => {
      sinon.restore();
      await utils.deleteData(testUsers);
      isPublicServiceEmailStub.restore();
      await utils.deleteData(testUsers);
    });

    it("should add secondary email", async () => {
      const username = "membre.nouveau";
      const secondaryEmail = "membre.nouveau.perso@example.com";

      await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .execute();
      await manageSecondaryEmailForUser({
        username,
        secondaryEmail,
      });

      const dbNewRes = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .execute();
      dbNewRes.length.should.equal(1);
      dbNewRes[0].secondary_email.should.equal(secondaryEmail);
    });

    it("should update secondary email", async () => {
      const username = "membre.nouveau";
      const secondaryEmail = "membre.nouveau.perso@example.com";
      const newSecondaryEmail = "membre.nouveau.new@example.com";

      await db
        .updateTable("users")
        .where("username", "=", username)
        .set({
          secondary_email: secondaryEmail,
        })
        .execute();
      await manageSecondaryEmailForUser({
        username,
        secondaryEmail: newSecondaryEmail,
      });
      const dbNewRes = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .execute();
      dbNewRes.length.should.equal(1);
      dbNewRes[0].secondary_email.should.equal(newSecondaryEmail);
      await db
        .updateTable("users")
        .where("username", "=", "membre.nouveau")
        .set({
          secondary_email: null,
        })
        .execute();
    });
  });

  describe("Test action managePrimaryEmailForUser", () => {
    let mattermostGetUserByEmailStub;
    let isPublicServiceEmailStub;
    let getServerSessionStub;
    let user;
    const managePrimaryEmailForUser = proxyquire(
      "@/app/api/member/actions/managePrimaryEmailForUser",
      {
        "next/cache": {
          revalidatePath: sinon.stub(),
        },
      },
    ).managePrimaryEmailForUser;

    beforeEach(async () => {
      mattermostGetUserByEmailStub = sinon
        .stub(mattermost, "getUserByEmail")
        .returns(Promise.resolve(true));
      isPublicServiceEmailStub = sinon
        .stub(controllerUtils, "isPublicServiceEmail")
        .returns(Promise.resolve(true));
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      await utils.createData(testUsers);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .executeTakeFirstOrThrow();
    });
    afterEach(async () => {
      sinon.restore();
      await utils.deleteData(testUsers);
      mattermostGetUserByEmailStub.restore();
      isPublicServiceEmailStub.restore();
      await utils.deleteData(testUsers);
    });

    it("should not update primary email if user is not current user", async () => {
      const mockSession = {
        user: { id: "anyuser", isAdmin: false, uuid: "anyuser-uuid" },
      };
      getServerSessionStub.resolves(mockSession);
      const username = "membre.nouveau";
      const primaryEmail = "membre.nouveau.new@example.com";
      try {
        await managePrimaryEmailForUser({ username, primaryEmail });
      } catch (e) {
        console.log(e);
      }

      isPublicServiceEmailStub.called.should.be.true;
      mattermostGetUserByEmailStub.calledTwice.should.be.false;
    });

    it("should not update primary email if email is not public service email", async () => {
      const username = "membre.nouveau";
      const primaryEmail = "membre.nouveau.new@example.com";
      isPublicServiceEmailStub.returns(Promise.resolve(false));

      const user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .executeTakeFirstOrThrow();

      const mockSession = {
        user: { id: "membre.nouveau", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);

      try {
        await managePrimaryEmailForUser({ username, primaryEmail });
      } catch (e) {
        console.log(e);
      }
      const dbNewRes = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .executeTakeFirstOrThrow();
      dbNewRes.primary_email?.should.not.equal(primaryEmail);
      isPublicServiceEmailStub.called.should.be.true;
      mattermostGetUserByEmailStub.calledOnce.should.be.false;
    });

    it("should not update primary email if email does not exist on mattermost", async () => {
      isPublicServiceEmailStub.returns(Promise.resolve(true));
      mattermostGetUserByEmailStub.returns(Promise.reject("404 error"));
      const username = "membre.nouveau";
      const primaryEmail = "membre.nouveau.new@example.com";
      const mockSession = {
        user: { id: "membre.nouveau", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);

      await db
        .updateTable("users")
        .where("username", "=", "membre.nouveau")
        .set({
          primary_email: `membre.nouveau@otherdomaine.gouv.fr`,
        })
        .execute();

      try {
        await managePrimaryEmailForUser({ username, primaryEmail });
      } catch (e) {
        console.log(e);
      }
      const dbNewRes = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .executeTakeFirstOrThrow();
      dbNewRes.primary_email?.should.not.equal(primaryEmail);

      mattermostGetUserByEmailStub.calledOnce.should.be.true;

      await db
        .updateTable("users")
        .where("username", "=", "membre.nouveau")
        .set({
          primary_email: `membre.nouveau@${config.domain}`,
        })
        .execute();
    });

    it("should not update primary email if email is an admin account", async () => {
      isPublicServiceEmailStub.returns(Promise.resolve(true));
      mattermostGetUserByEmailStub.returns(Promise.reject("404 error"));
      const username = "membre.nouveau";
      const primaryEmail = "admin@otherdomaine.gouv.fr";
      const mockSession = {
        user: { id: "membre.nouveau", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);

      await db
        .updateTable("users")
        .where("username", "=", "membre.nouveau")
        .set({
          primary_email: `membre.nouveau@${config.domain}`,
        })
        .execute();

      try {
        await managePrimaryEmailForUser({ username, primaryEmail });
      } catch (e) {}
      const dbNewRes = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .executeTakeFirstOrThrow();
      dbNewRes.primary_email?.should.equal(`membre.nouveau@${config.domain}`);
      await db
        .updateTable("users")
        .where("username", "=", "membre.nouveau")
        .set({
          primary_email: `membre.nouveau@${config.domain}`,
        })
        .execute();
    });

    it("should update primary email", async () => {
      isPublicServiceEmailStub.returns(Promise.resolve(true));
      mattermostGetUserByEmailStub.returns(Promise.resolve(true));
      const createRedirectionStub = sinon
        .stub(betagouv, "createRedirection")
        .returns(Promise.resolve(true));
      const deleteEmailStub = sinon
        .stub(betagouv, "deleteEmail")
        .returns(Promise.resolve(true));
      const username = "membre.nouveau";
      const primaryEmail = "membre.nouveau.new@example.com";
      const mockSession = {
        user: { id: "membre.nouveau", isAdmin: false, uuid: user.uuid },
      };
      getServerSessionStub.resolves(mockSession);

      await managePrimaryEmailForUser({ username, primaryEmail });

      const dbNewRes = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .executeTakeFirstOrThrow();
      dbNewRes.primary_email?.should.equal(primaryEmail);
      await db
        .updateTable("users")
        .where("username", "=", "membre.nouveau")
        .set({
          primary_email: `${username}@${config.domain}`,
        })
        .execute();
      createRedirectionStub.called.should.be.true;
      deleteEmailStub.called.should.be.true;
      isPublicServiceEmailStub.called.should.be.true;
      // mattermostGetUserByEmailStub.calledOnce.should.be.true;
      createRedirectionStub.restore();
      deleteEmailStub.restore();
    });

    it("should update primary email if user is admin", async () => {
      isPublicServiceEmailStub.returns(Promise.resolve(true));
      mattermostGetUserByEmailStub.returns(Promise.resolve(true));
      const createRedirectionStub = sinon
        .stub(betagouv, "createRedirection")
        .returns(Promise.resolve(true));
      const deleteEmailStub = sinon
        .stub(betagouv, "deleteEmail")
        .returns(Promise.resolve(true));
      const username = "membre.nouveau";
      const primaryEmail = "membre.nouveau.new@example.com";
      const adminUser = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.actif")
        .executeTakeFirstOrThrow();
      const mockSession = {
        user: {
          id: "membre.actif",
          isAdmin: true,
          uuid: adminUser.uuid,
        },
      };
      getServerSessionStub.resolves(mockSession);

      await managePrimaryEmailForUser({ username, primaryEmail });

      const dbNewRes = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.nouveau")
        .executeTakeFirstOrThrow();
      dbNewRes.primary_email?.should.equal(primaryEmail);
      await db
        .updateTable("users")
        .where("username", "=", "membre.nouveau")
        .set({
          primary_email: `${username}@${config.domain}`,
        })
        .execute();
      createRedirectionStub.called.should.be.true;
      deleteEmailStub.called.should.be.true;
      isPublicServiceEmailStub.called.should.be.true;
      // mattermostGetUserByEmailStub.calledOnce.should.be.true;
      createRedirectionStub.restore();
      deleteEmailStub.restore();
    });
  });

  describe("cronjob", () => {
    before(async () => {
      //await knex("marrainage").truncate();
    });
    let betagouvCreateEmail;
    beforeEach((done) => {
      betagouvCreateEmail = sinon.spy(Betagouv, "createEmail");
      done();
    });

    afterEach(async () => {
      betagouvCreateEmail.restore();
    });
    describe("", () => {
      const users: FakeDataInterface = {
        users: [
          {
            username: "membre.actif",
            fullname: "membre Actif",
            missions: [
              {
                start: new Date("2016-11-03"),
                status: "independent",
                employer: "octo",
                end: new Date(),
              },
            ],
          },
          {
            username: "membre.nouveau",
            fullname: "membre Nouveau",
            missions: [
              {
                start: new Date(),
                end: addDays(new Date(), 500),
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
    });
    //   it("should create missing email accounts", async () => {
    //     utils.cleanMocks();
    //     utils.mockSlackGeneral();
    //     utils.mockSlackSecretariat();
    //     utils.mockOvhTime();
    //     utils.mockOvhRedirections();
    //     utils.mockOvhUserResponder();
    //     utils.mockOvhUserEmailInfos();

    //     const newMember = testUsers.users?.find(
    //       (user) => user.username === "membre.nouveau",
    //     )!;
    //     const allAccountsExceptANewMember = testUsers.users?.filter(
    //       (user) => user.username !== newMember.username,
    //     )!;

    //     nock(/.*ovh.com/)
    //       .get(/^.*email\/domain\/.*\/account/)
    //       .reply(
    //         200,
    //         allAccountsExceptANewMember.map((user) => user.username),
    //       );
    //     const ovhEmailCreation = nock(/.*ovh.com/)
    //       .post(/^.*email\/domain\/.*\/account/)
    //       .reply(200);
    //     //await knex("login_tokens").truncate();
    //     await db
    //       .updateTable("users")
    //       .where("username", "=", newMember.username)
    //       .set({
    //         primary_email: null,
    //         primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
    //         secondary_email: "membre.nouveau.perso@example.com",
    //       })
    //       .execute();
    //     // const val = await db
    //     //     .updateTable("users")
    //     //     .selectAll()
    //     //     .set({
    //     //         username: newMember.id,
    //     //     })
    //     //     .execute();
    //     await createEmailAddresses();
    //     ovhEmailCreation.isDone().should.be.true;
    //     betagouvCreateEmail.firstCall.args[0].should.equal(newMember.username);
    //     await db
    //       .updateTable("users")
    //       .where("username", "=", newMember.username)
    //       .set({
    //         secondary_email: null,
    //         primary_email: `${newMember.username}@${config.domain}`,
    //       })
    //       .execute();
    //   });
    // });

    context("", () => {});

    // it("should not create email accounts if already created", async () => {
    //   utils.cleanMocks();
    //   utils.mockSlackGeneral();
    //   utils.mockSlackSecretariat();
    //   utils.mockOvhTime();
    //   utils.mockOvhRedirections();

    //   // We return an email for membre.nouveau to indicate he already has one
    //   const newMember = testUsers.users?.find(
    //     (user) => user.username === "membre.nouveau",
    //   );

    //   nock(/.*ovh.com/)
    //     .get(/^.*email\/domain\/.*\/account/)
    //     .reply(200, [newMember]);

    //   const ovhEmailCreation = nock(/.*ovh.com/)
    //     .post(/^.*email\/domain\/.*\/account/)
    //     .reply(200);

    //   await createEmailAddresses();
    //   betagouvCreateEmail.notCalled.should.be.true;
    //   ovhEmailCreation.isDone().should.be.false;
    // });

    // it("should not create email accounts if we dont have the secondary email", async () => {
    //   const ovhEmailCreation = nock(/.*ovh.com/)
    //     .post(/^.*email\/domain\/.*\/account/)
    //     .reply(200);

    //   await createEmailAddresses();
    //   betagouvCreateEmail.notCalled.should.be.true;
    //   ovhEmailCreation.isDone().should.be.false;
    // });
    describe("", () => {
      const users: FakeDataInterface = {
        users: [
          {
            username: "membre.nouveau",
            fullname: "membre Nouveau",
            missions: [
              {
                start: new Date(),
                end: addDays(new Date(), 500),
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
      it("should subscribe user to incubateur mailing list", async () => {
        const url = process.env.USERS_API || "https://beta.gouv.fr";
        utils.cleanMocks();
        utils.mockSlackGeneral();
        utils.mockSlackSecretariat();
        utils.mockOvhTime();
        utils.mockOvhRedirections();
        const subscribeSpy = sinon.spy(Betagouv, "subscribeToMailingList");
        const newMember = testUsers.users?.find(
          (user) => user.username === "membre.nouveau",
        );
        nock(/.*ovh.com/)
          .get(/^.*email\/domain\/.*\/account/)
          .reply(200, [newMember]);
        nock(/.*ovh.com/)
          .get(/^.*email\/domain\/.*\/mailingList\/.*\/subscriber/)
          .reply(200, []);
        const ovhMailingListSubscription = nock(/.*ovh.com/)
          .post(/^.*email\/domain\/.*\/mailingList\/.*\/subscriber/)
          .reply(200)
          .persist();

        await subscribeEmailAddresses();
        ovhMailingListSubscription.isDone().should.be.true;
        subscribeSpy.firstCall.args[0].should.equal(
          config.incubateurMailingListName,
        );
        subscribeSpy.firstCall.args[1].should.equal(
          `membre.nouveau@${config.domain}`,
        );
        subscribeSpy.restore();
      });
    });

    context(
      "should unsubscribe user from incubateur mailing list",
      async () => {
        let users = {
          users: [
            {
              username: "membre.nouveau",
              fullname: "membre Nouveau",
              missions: [
                {
                  start: new Date("12/01/1990"),
                  end: new Date("12/01/1991"),
                },
              ],
            },
          ],
        };
        let unsubscribeSpy;
        beforeEach(async () => {
          await utils.createData(users);
          utils.cleanMocks();
          utils.mockSlackGeneral();
          utils.mockSlackSecretariat();
          utils.mockOvhTime();
          utils.mockOvhRedirections();
          unsubscribeSpy = sinon.spy(Betagouv, "unsubscribeFromMailingList");
        });
        afterEach(async () => {
          await utils.deleteData(users);
          unsubscribeSpy.restore();
        });

        it("ovhMailingListUnsubscription should be called", async () => {
          const url = process.env.USERS_API || "https://beta.gouv.fr";
          const newMember = testUsers.users?.find(
            (user) => user.username === "membre.nouveau",
          );
          nock(/.*ovh.com/)
            .get(/^.*email\/domain\/.*\/account/)
            .reply(200, [newMember]);
          nock(/.*ovh.com/)
            .get(/^.*email\/domain\/.*\/mailingList\/.*\/subscriber/)
            .reply(200, [`membre.nouveau@${config.domain}`]);
          const ovhMailingListUnsubscription = nock(/.*ovh.com/)
            .delete(/^.*email\/domain\/.*\/mailingList\/.*\/subscriber.*/)
            .reply(200)
            .persist();

          await unsubscribeEmailAddresses();
          ovhMailingListUnsubscription.isDone().should.be.true;
          unsubscribeSpy.firstCall.args[0].should.equal(
            config.incubateurMailingListName,
          );
          unsubscribeSpy.firstCall.args[1].should.equal(
            `membre.nouveau@${config.domain}`,
          );
        });
      },
    );
    context("should create redirection missing email accounts", () => {
      let users: FakeDataInterface = {
        users: [
          {
            username: "membre.actif",
            fullname: "membre Actif",
            missions: [
              {
                start: new Date("2016-11-03"),
                end: new Date(),
                status: "independent",
                employer: "octo",
              },
            ],
          },
          {
            username: "membre.nouveau",
            fullname: "membre Nouveau",
            missions: [
              {
                start: new Date(),
                end: addDays(new Date(), 500),
              },
            ],
          },
        ],
      };
      let createRedirection;
      beforeEach(async () => {
        utils.cleanMocks();
        utils.mockSlackGeneral();
        utils.mockSlackSecretariat();
        utils.mockOvhTime();
        utils.mockOvhRedirections();
        utils.mockOvhUserResponder();
        utils.mockOvhUserEmailInfos();
        createRedirection = sinon.spy(betagouv, "createRedirection");
        await utils.createData(users);
      });
      afterEach(async () => {
        createRedirection.restore();
        await utils.deleteData(users);
      });
    });
  });
  //   it("should create redirection missing email accounts", async () => {
  //     const ovhRedirectionCreation = nock(/.*ovh.com/)
  //       .post(/^.*email\/domain\/.*\/redirection/)
  //       .reply(200);
  //     //await knex("login_tokens").truncate();
  //     const newMember = testUsers.users!.find(
  //       (user) => user.username === "membre.nouveau",
  //     )!;
  //     const allAccountsExceptANewMember =
  //       testUsers.users?.filter(
  //         (user) => user.username !== newMember?.username,
  //       ) || [];

  //     nock(/.*ovh.com/)
  //       .get(/^.*email\/domain\/.*\/redirection/)
  //       .reply(
  //         200,
  //         allAccountsExceptANewMember.map((user) => user.username),
  //       );
  //     nock(/.*ovh.com/)
  //       .get(/^.*email\/domain\/.*\/account/)
  //       .reply(
  //         200,
  //         allAccountsExceptANewMember.map((user) => user.username),
  //       );
  //     await db
  //       .updateTable("users")
  //       .where("username", "=", newMember.username)
  //       .set({
  //         primary_email: null,
  //         primary_email_status: EmailStatusCode.EMAIL_CREATION_WAITING,
  //         secondary_email: "membre.nouveau.perso@example.com",
  //         email_is_redirection: true,
  //       })
  //       .execute();
  //     const val = await db
  //       .selectFrom("users")
  //       .selectAll()
  //       .where("username", "=", newMember.username)
  //       .execute();
  //     await createEmailAddresses();
  //     ovhRedirectionCreation.isDone().should.be.false;
  //     await createRedirectionEmailAdresses();
  //     ovhRedirectionCreation.isDone().should.be.true;
  //     createRedirection.firstCall.args[0].should.equal(
  //       `${newMember.username}-attr@${config.domain}`,
  //     );
  //     createRedirection.calledOnce.should.be.true;
  //     await db
  //       .updateTable("users")
  //       .where("username", "=", newMember.username)
  //       .set({
  //         secondary_email: null,
  //         primary_email: `${newMember.username}@${config.domain}`,
  //         email_is_redirection: false,
  //       })
  //       .execute();
  //   });
  // });
  //});

  describe("createEmail", () => {
    const sandbox = sinon.createSandbox();

    beforeEach(async () => {
      sandbox.stub(Betagouv, "createEmail");
      sandbox.stub(Betagouv, "createEmailForExchange");
      sandbox.stub(Betagouv, "createEmailPro");
      sandbox.stub(Betagouv, "sendInfoToChat");
    });

    afterEach(async () => {
      sandbox.restore();
      // await db
      //     .deleteFrom("users")
      //     .where("username", "=", "membre.nouveau-email")
      //     .execute();
    });

    context("when the user needs an MX PLAN account", () => {
      const users: FakeDataInterface = {
        users: [
          {
            username: "membre.nouveau-email",
            domaine: Domaine.ANIMATION,
            role: "",
            fullname: "Membre Nouveau-email",
            primary_email: undefined,
            primary_email_status: EmailStatusCode.EMAIL_UNSET,
            secondary_email: "membre.nouveau-email.perso@example.com",
            missions: [
              {
                end: new Date("2024-12-03"),
                start: new Date("2023-12-03"),
              },
            ],
          },
        ],
      };
      beforeEach(async () => {
        return utils.createData(users);
      });
      afterEach(async () => {
        return utils.deleteData(users);
      });
      it("should create an OVH MX Plan account", async () => {
        await createEmail("membre.nouveau-email", "Test");
        Betagouv.createEmail.calledWith("membre.nouveau-email").should.be.true;
      });
    });

    context("when the user needs an OVH Pro account", () => {
      let users: FakeDataInterface = {
        users: [
          {
            id: "membre.nouveau-email",
            username: "membre.nouveau-email",
            primary_email: undefined,
            primary_email_status: EmailStatusCode.EMAIL_UNSET,
            secondary_email: "membre.nouveau-email.perso@example.com",
            domaine: Domaine.ANIMATION,
            role: "",
            fullname: "Membre Nouveau test email",
            missions: [
              {
                end: new Date("2024-12-03"),
                start: new Date("2023-12-03"),
                status: "independent",
                employer: "octo",
                startups: [],
              },
            ],
          },
        ],
      };
      beforeEach(async () => {
        await utils.createData(users);
        sandbox
          .stub(config, "EMAIL_DEFAULT_PLAN")
          .value(EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO);
      });
      afterEach(async () => {
        await utils.deleteData(users);
        sandbox.restore();
      });
      it("should create an OVH Pro email account", async () => {
        await createEmail("membre.nouveau-email", "Test");
        Betagouv.createEmailPro.firstCall.args.should.deep.equal([
          "membre.nouveau-email",
          {
            displayName: "Membre Nouveau test email",
            firstName: "Membre",
            lastName: "Nouveau test email",
          },
        ]);
      });
    });

    context("when the user needs an Exchange account", () => {
      const users: FakeDataInterface = {
        users: [
          {
            username: "membre.nouveau-email",
            domaine: Domaine.ANIMATION,
            role: "",
            fullname: "Membre Nouveau test email",
            primary_email: undefined,
            primary_email_status: EmailStatusCode.EMAIL_UNSET,
            secondary_email: "membre.nouveau-email.perso@example.com",
            missions: [
              {
                end: new Date("2024-12-03"),
                start: new Date("2023-12-03"),
                startups: ["a-startup-at-gip"],
              },
            ],
          },
        ],
        startups: [
          {
            ghid: "a-startup-at-gip",
          },
        ],
      };
      beforeEach(async () => {
        const insertedIncubator = await db
          .insertInto("incubators")
          .values({
            title: "Gip",
            ghid: "gip-inclusion",
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        const insertedStartup = await db
          .insertInto("startups")
          .values({
            incubator_id: insertedIncubator.uuid,
            name: "a-startup-at-gip",
            ghid: "a-startup-at-gip",
          })
          .execute();
        await utils.createData(users);
        // sandbox.stub(Betagouv, "startupsInfos").resolves([
        //     {
        //         type: "startup",
        //         id: "itou",
        //         attributes: {
        //             name: "Itou",
        //         },
        //         relationships: {
        //             incubator: {
        //                 data: {
        //                     type: "incubator",
        //                     id: "gip-inclusion",
        //                 },
        //             },
        //         },
        //     },
        // ]);
      });

      afterEach(async () => {
        await utils.deleteData(users);
        await db
          .deleteFrom("startups")
          .where("name", "=", "a-startup-at-gip")
          .execute();
        await db
          .deleteFrom("incubators")
          .where("ghid", "=", "gip-inclusion")
          .execute();

        sandbox.restore();
      });

      it("should create an Exchange email account", async () => {
        await createEmail("membre.nouveau-email", "Test");

        Betagouv.createEmailForExchange.firstCall.args.should.deep.equal([
          "membre.nouveau-email",
          {
            displayName: "Membre Nouveau test email",
            firstName: "Membre",
            lastName: "Nouveau test email",
          },
        ]);
      });
    });
  });
});
