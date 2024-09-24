import chai from "chai";
import chaiHttp from "chai-http";
import nock from "nock";
import sinon from "sinon";

import testUsers from "./users.json";
import utils from "./utils";
import { db } from "@/lib/kysely";
import * as mattermost from "@/lib/mattermost";
import { Domaine, EmailStatusCode } from "@/models/member";
import { EMAIL_PLAN_TYPE } from "@/models/ovh";
import routes from "@/routes/routes";
import config from "@/server/config";
import { createEmail } from "@/server/controllers/usersController/createEmailForUser";
import * as session from "@/server/helpers/session";
import app from "@/server/index";
import betagouv from "@betagouv";
import Betagouv from "@betagouv";
import * as controllerUtils from "@controllers/utils";
import knex from "@db";
import {
    createEmailAddresses,
    createRedirectionEmailAdresses,
    subscribeEmailAddresses,
    unsubscribeEmailAddresses,
} from "@schedulers/emailScheduler";

chai.use(chaiHttp);

describe("User", () => {
    let ovhPasswordNock;

    describe("POST /api/users/:username/create-email unauthenticated", () => {
        it("should return an Unauthorized error", (done) => {
            chai.request(app)
                .post(
                    routes.USER_CREATE_EMAIL_API.replace(
                        ":username",
                        "membre.parti"
                    )
                )
                .type("form")
                .send({
                    _method: "POST",
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
    describe("POST /api/users/:username/create-email authenticated", () => {
        let getToken;
        let sendEmailStub;
        beforeEach(async () => {
            sendEmailStub = sinon
                .stub(controllerUtils, "sendMail")
                .returns(Promise.resolve(true));
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.actif"));
            await utils.createUsers(testUsers);
        });

        afterEach(async () => {
            sendEmailStub.restore();
            getToken.restore();
            await utils.deleteUsers(testUsers);
        });

        it("should ask OVH to create an email", async () => {
            const ovhEmailCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account/)
                .reply(200);
            await db
                .updateTable("users")
                .where("username", "=", "membre.nouveau")
                .set({
                    primary_email: null,
                })
                .execute();
            await chai
                .request(app)
                .post(
                    routes.USER_CREATE_EMAIL_API.replace(
                        ":username",
                        "membre.nouveau"
                    )
                )
                .type("form")
                .send({});

            const res = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.nouveau")
                .executeTakeFirst();
            res.primary_email.should.equal(`membre.nouveau@${config.domain}`);
            ovhEmailCreation.isDone().should.be.true;
        });

        it("should not allow email creation from delegate if email already exists", (done) => {
            // For this case we need to reset the basic nocks in order to return
            // a different response to indicate that membre.nouveau has an
            // existing email already created.
            utils.cleanMocks();
            utils.mockUsers();
            utils.mockSlackGeneral();
            utils.mockSlackSecretariat();
            utils.mockOvhTime();
            utils.mockOvhRedirections();

            // We return an email for membre.nouveau to indicate he already has one
            nock(/.*ovh.com/)
                .get(/^.*email\/domain\/.*\/account\/.*/)
                .reply(200, {
                    accountName: "membre.nouveau",
                    email: "membre.nouveau@example.com",
                });

            const ovhEmailCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account/)
                .reply(200);

            chai.request(app)
                .post(
                    routes.USER_CREATE_EMAIL_API.replace(
                        ":username",
                        "membre.nouveau"
                    )
                )
                .type("form")
                .send({})
                .end((err, res) => {
                    ovhEmailCreation.isDone().should.be.false;
                    done();
                });
        });

        it("should not allow email creation from delegate if github file doesn't exist", (done) => {
            const ovhEmailCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account/)
                .reply(200);

            chai.request(app)
                .post(
                    routes.USER_CREATE_EMAIL_API.replace(
                        ":username",
                        "membre.sans.fiche"
                    )
                )
                .type("form")
                .send({})
                .end((err, res) => {
                    ovhEmailCreation.isDone().should.be.false;
                    done();
                });
        });

        it("should not allow email creation from delegate if user has expired", (done) => {
            const ovhEmailCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account/)
                .reply(200);

            chai.request(app)
                .post(
                    routes.USER_CREATE_EMAIL_API.replace(
                        ":username",
                        "membre.expire"
                    )
                )
                .type("form")
                .send({})
                .end((err, res) => {
                    ovhEmailCreation.isDone().should.be.false;
                    done();
                });
        });

        it("should not allow email creation from delegate if delegate has expired", (done) => {
            const ovhEmailCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account/)
                .reply(200);
            getToken.returns(utils.getJWT("membre.expire"));

            chai.request(app)
                .post(
                    routes.USER_CREATE_EMAIL_API.replace(
                        ":username",
                        "membre.nouveau"
                    )
                )
                .type("form")
                .send({})
                .end((err, res) => {
                    ovhEmailCreation.isDone().should.be.false;
                    done();
                });
        });

        it("should allow email creation from delegate if user is active", async () => {
            const ovhEmailCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account/)
                .reply(200);
            await db
                .updateTable("users")
                .where("username", "=", "membre.actif")
                .set({
                    primary_email: null,
                })
                .execute();
            getToken.returns(utils.getJWT("julien.dauphant"));
            await chai
                .request(app)
                .post(
                    routes.USER_CREATE_EMAIL_API.replace(
                        ":username",
                        "membre.actif"
                    )
                )
                .type("form")
                .send({});
            ovhEmailCreation.isDone().should.be.true;
            const user = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.actif")
                .executeTakeFirstOrThrow();
        });
    });

    describe("POST /api/users/:username/create-email unauthenticated", () => {
        it("should return an Unauthorized error", (done) => {
            chai.request(app)
                .post("/api/users/membre.parti/create-email")
                .send({
                    _method: "POST",
                    to_email: "test@example.com",
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
    describe("POST /api/users/:username/create-email authenticated", () => {
        let getToken;
        let sendEmailStub;
        beforeEach(async () => {
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.actif"));
            sendEmailStub = sinon
                .stub(controllerUtils, "sendMail")
                .returns(Promise.resolve(true));
            await utils.createUsers(testUsers);
        });

        afterEach(async () => {
            sendEmailStub.restore();
            getToken.restore();
            await utils.deleteUsers(testUsers);
        });

        it("should ask OVH to create an email", async () => {
            const ovhEmailCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account/)
                .reply(200);
            await db
                .updateTable("users")
                .where("username", "=", "membre.nouveau")
                .set({
                    primary_email: null,
                })
                .execute();
            await chai
                .request(app)
                .post("/api/users/membre.nouveau/create-email")
                .send({
                    to_email: "test@example.com",
                });

            const res = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.nouveau")
                .executeTakeFirstOrThrow();
            res.primary_email.should.equal(`membre.nouveau@${config.domain}`);
            ovhEmailCreation.isDone().should.be.true;
        });
    });

    describe("POST /api/users/:username/redirections unauthenticated", () => {
        it("should return an Unauthorized error", (done) => {
            chai.request(app)
                .post("/api/users/membre.parti/redirections")
                .type("form")
                .send({
                    to_email: "test@example.com",
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });

    describe("POST /api/users/:username/redirections authenticated", () => {
        let getToken;
        let isPublicServiceEmailStub;

        beforeEach(async () => {
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.actif"));
            isPublicServiceEmailStub = sinon
                .stub(controllerUtils, "isPublicServiceEmail")
                .returns(Promise.resolve(true));
            await utils.createUsers(testUsers);
        });

        afterEach(async () => {
            getToken.restore();
            isPublicServiceEmailStub.restore();
            await utils.deleteUsers(testUsers);
        });

        it("should ask OVH to create a redirection", (done) => {
            isPublicServiceEmailStub.returns(Promise.resolve(true));

            const ovhRedirectionCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/redirection/)
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.actif/redirections")
                .type("form")
                .send({
                    to_email: "test@example.com",
                })
                .end((err, res) => {
                    ovhRedirectionCreation.isDone().should.be.true;
                    done();
                });
        });

        it("should not allow redirection creation from delegate", (done) => {
            const ovhRedirectionCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/redirection/)
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.nouveau/redirections")
                .type("form")
                .send({
                    to_email: "test@example.com",
                })
                .end((err, res) => {
                    ovhRedirectionCreation.isDone().should.be.false;
                    done();
                });
        });

        it("should not allow redirection creation from expired users", (done) => {
            const ovhRedirectionCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/redirection/)
                .reply(200);
            getToken.returns(utils.getJWT("membre.expire"));
            chai.request(app)
                .post("/api/users/membre.expire/redirections")
                .type("form")
                .send({
                    to_email: "test@example.com",
                })
                .end((err, res) => {
                    ovhRedirectionCreation.isDone().should.be.false;
                    done();
                });
        });
    });

    describe("Delete /api/users/:username/redirections/:email/delete unauthenticated", () => {
        it("should return an Unauthorized error", (done) => {
            chai.request(app)
                .delete(
                    "/api/users/membre.parti/redirections/test@example.com/delete"
                )
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });

    describe("Delete /api/users/:username/redirections/:email/delete authenticated", () => {
        let getToken;
        let isPublicServiceEmailStub;

        beforeEach(async () => {
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.actif"));
            isPublicServiceEmailStub = sinon
                .stub(controllerUtils, "isPublicServiceEmail")
                .returns(Promise.resolve(true));
            await utils.createUsers(testUsers);
        });

        afterEach(async () => {
            getToken.restore();
            isPublicServiceEmailStub.restore();
            await utils.deleteUsers(testUsers);
        });

        it("should ask OVH to delete a redirection", async () => {
            const ovhRedirectionDeletion = nock(/.*ovh.com/)
                .delete(/^.*email\/domain\/.*\/redirection\/.*/)
                .reply(200);

            const res = await chai
                .request(app)
                .delete(
                    "/api/users/membre.actif/redirections/test-2@example.com/delete"
                );
            ovhRedirectionDeletion.isDone().should.be.true;
        });

        it("should not allow redirection deletion from delegate", (done) => {
            const ovhRedirectionDeletion = nock(/.*ovh.com/)
                .delete(/^.*email\/domain\/.*\/redirection\/.*/)
                .reply(200);

            chai.request(app)
                .delete(
                    "/api/users/membre.nouveau/redirections/test-2@example.com/delete"
                )
                .end((err, res) => {
                    ovhRedirectionDeletion.isDone().should.be.false;
                    done();
                });
        });

        it("should not allow redirection deletion from expired users", (done) => {
            const ovhRedirectionDeletion = nock(/.*ovh.com/)
                .delete(/^.*email\/domain\/.*\/redirection\/.*/)
                .reply(200);
            getToken.returns(utils.getJWT("membre.expire"));

            chai.request(app)
                .delete(
                    "/api/users/membre.expire/redirections/test-2@example.com/delete"
                )
                .end((err, res) => {
                    ovhRedirectionDeletion.isDone().should.be.false;
                    done();
                });
        });
    });

    describe("POST /users/:username/password unauthenticated", () => {
        beforeEach(async () => {
            await utils.createUsers(testUsers);
        });

        afterEach(async () => {
            // getToken.restore();
            await utils.deleteUsers(testUsers);
        });

        it("should return an Unauthorized error", (done) => {
            chai.request(app)
                .post("/api/users/membre.actif/password")
                .type("form")
                .send({
                    new_password: "Test_Password_1234",
                })
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
        it("should not allow a password change", (done) => {
            ovhPasswordNock = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.actif/password")
                .type("form")
                .send({
                    new_password: "Test_Password_1234",
                })
                .end((err, res) => {
                    ovhPasswordNock.isDone().should.be.false;
                    done();
                });
        });
    });

    describe("POST /api/users/:username/password authenticated", () => {
        let getToken;
        let isPublicServiceEmailStub;
        beforeEach(async () => {
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.actif"));
            isPublicServiceEmailStub = sinon
                .stub(controllerUtils, "isPublicServiceEmail")
                .returns(Promise.resolve(true));
            await utils.createUsers(testUsers);
        });

        afterEach(async () => {
            getToken.restore();
            isPublicServiceEmailStub.restore();
            await utils.deleteUsers(testUsers);
        });

        it("should send error if user does not exist", async () => {
            const res = await chai
                .request(app)
                .post("/api/users/membre.actif/password")
                .type("form")
                .send({
                    new_password: "Test_Password_1234",
                })
                .redirects(0);
            // .end((err, res) => {
            res.should.have.status(500);
            // res.header.location.should.equal("/community/membre.actif");
            // done();
            // });
        });
        it("should perform a password change if the email exists", async () => {
            utils.cleanMocks();
            utils.mockUsers();
            utils.mockOvhUserResponder();
            utils.mockSlackGeneral();
            utils.mockSlackSecretariat();
            utils.mockOvhTime();
            utils.mockOvhRedirections();
            const username = "membre.nouveau";
            await db
                .updateTable("users")
                .where("username", "=", username)
                .set({ primary_email_status: EmailStatusCode.EMAIL_ACTIVE })
                .execute();
            nock(/.*ovh.com/)
                .get(/^.*email\/domain\/.*\/account\/.*/)
                .reply(200, {
                    accountName: username,
                    email: "membre.nouveau@example.com",
                })
                .persist();

            ovhPasswordNock = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
                .reply(200);
            getToken.returns(utils.getJWT(`${username}`));
            await chai
                .request(app)
                .post(`/api/users/${username}/password`)
                .type("form")
                .send({
                    new_password: "Test_Password_1234",
                });
            ovhPasswordNock.isDone().should.be.true;
        });
        it("should perform a password change and pass status to active if status was suspended", async () => {
            utils.cleanMocks();
            utils.mockUsers();
            utils.mockOvhUserResponder();
            utils.mockSlackGeneral();
            utils.mockSlackSecretariat();
            utils.mockOvhTime();
            utils.mockOvhRedirections();
            const username = "membre.nouveau";
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
                    email: "membre.nouveau@example.com",
                })
                .persist();

            ovhPasswordNock = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
                .reply(200);
            getToken.returns(utils.getJWT(`${username}`));
            await chai
                .request(app)
                .post(`/api/users/${username}/password`)
                .type("form")
                .send({
                    new_password: "Test_Password_1234",
                });
            ovhPasswordNock.isDone().should.be.true;
            const user = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", username)
                .executeTakeFirst();
            user.primary_email_status.should.be.equal(
                EmailStatusCode.EMAIL_ACTIVE
            );
        });

        it("should not allow a password change from delegate", (done) => {
            ovhPasswordNock = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.nouveau/password")
                .type("form")
                .send({
                    new_password: "Test_Password_1234",
                })
                .end((err, res) => {
                    ovhPasswordNock.isDone().should.be.false;
                    done();
                });
        });
        it("should not allow a password change from expired user", (done) => {
            ovhPasswordNock = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
                .reply(200);
            getToken.returns(utils.getJWT("membre.expire"));

            chai.request(app)
                .post("/api/users/membre.expire/password")
                .type("form")
                .send({
                    new_password: "Test_Password_1234",
                })
                .end((err, res) => {
                    ovhPasswordNock.isDone().should.be.false;
                    done();
                });
        });
        it("should not allow a password shorter than 9 characters", (done) => {
            ovhPasswordNock = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.actif/password")
                .type("form")
                .send({
                    new_password: "12345678",
                })
                .end((err, res) => {
                    ovhPasswordNock.isDone().should.be.false;
                    done();
                });
        });
        it("should not allow a password longer than 30 characters", (done) => {
            ovhPasswordNock = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account\/.*\/changePassword/)
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.actif/password")
                .type("form")
                .send({
                    new_password: "1234567890123456789012345678901",
                })
                .end((err, res) => {
                    ovhPasswordNock.isDone().should.be.false;
                    done();
                });
        });
    });

    describe("POST /users/:username/email/delete unauthenticated", () => {
        it("should return an Unauthorized error", (done) => {
            chai.request(app)
                .post("/api/users/membre.parti/email/delete")
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });

    describe("POST /user/:username/email/delete", () => {
        let getToken;
        let isPublicServiceEmailStub;

        beforeEach(async () => {
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.actif"));
            isPublicServiceEmailStub = sinon
                .stub(controllerUtils, "isPublicServiceEmail")
                .returns(Promise.resolve(true));
            await utils.createUsers(testUsers);
        });

        afterEach(async () => {
            getToken.restore();
            isPublicServiceEmailStub.restore();
            await utils.deleteUsers(testUsers);
        });
        it("should keep the user in database secretariat", async () => {
            const addRedirection = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/redirection/)
                .reply(200);

            const dbRes = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.actif")
                .execute();
            dbRes.length.should.equal(1);
            await chai
                .request(app)
                .post("/api/users/membre.actif/email/delete");
            const dbNewRes = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.actif")
                .execute();
            dbNewRes.length.should.equal(1);
            addRedirection.isDone().should.be.true;
        });

        it("should ask OVH to redirect to the departs email", (done) => {
            const expectedRedirectionBody = (body) => {
                return (
                    body.from === `membre.actif@${config.domain}` &&
                    body.to === config.leavesEmail
                );
            };

            const ovhRedirectionDepartureEmail = nock(/.*ovh.com/)
                .post(
                    /^.*email\/domain\/.*\/redirection/,
                    expectedRedirectionBody
                )
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.actif/email/delete")
                .end((err, res) => {
                    ovhRedirectionDepartureEmail.isDone().should.be.true;
                    done();
                });
        });
    });

    describe("POST /users/:username/secondary_email", () => {
        let getToken;
        let isPublicServiceEmailStub;

        beforeEach(async () => {
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.nouveau"));
            await utils.createUsers(testUsers);
            isPublicServiceEmailStub = sinon
                .stub(controllerUtils, "isPublicServiceEmail")
                .returns(Promise.resolve(true));
        });

        afterEach(async () => {
            getToken.restore();
            await utils.deleteUsers(testUsers);
            isPublicServiceEmailStub.restore();
        });
        it("should return 200 to add secondary email", async () => {
            const username = "membre.nouveau";
            const secondaryEmail = "membre.nouveau.perso@example.com";
            const res = await chai
                .request(app)
                .post("/api/users/membre.nouveau/secondary_email")
                .type("form")
                .send({
                    username,
                    secondaryEmail,
                });
            res.should.have.status(200);
        });

        it("should add secondary email", async () => {
            const username = "membre.nouveau";
            const secondaryEmail = "membre.nouveau.perso@example.com";

            await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.nouveau")
                .execute();
            await chai
                .request(app)
                .post(`/api/users/${username}/secondary_email`)
                .type("form")
                .send({
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
            await chai
                .request(app)
                .post(`/api/users/${username}/secondary_email/`)
                .type("form")
                .send({
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

    describe("PUT /api/users/:username/primary_email", () => {
        let mattermostGetUserByEmailStub;
        let isPublicServiceEmailStub;
        let getToken;

        beforeEach(async () => {
            mattermostGetUserByEmailStub = sinon
                .stub(mattermost, "getUserByEmail")
                .returns(Promise.resolve(true));
            isPublicServiceEmailStub = sinon
                .stub(controllerUtils, "isPublicServiceEmail")
                .returns(Promise.resolve(true));
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.nouveau"));
            await utils.createUsers(testUsers);
        });
        afterEach(async () => {
            mattermostGetUserByEmailStub.restore();
            isPublicServiceEmailStub.restore();
            getToken.restore();
            await utils.deleteUsers(testUsers);
        });

        it("should not update primary email if user is not current user", async () => {
            const username = "membre.nouveau";
            const primaryEmail = "membre.nouveau.new@example.com";
            getToken.returns(utils.getJWT("julien.dauphant"));

            await chai
                .request(app)
                .put(`/api/users/${username}/primary_email/`)
                .type("form")
                .send({
                    username,
                    primaryEmail: primaryEmail,
                });
            isPublicServiceEmailStub.called.should.be.true;
            mattermostGetUserByEmailStub.calledTwice.should.be.false;
        });

        it("should not update primary email if email is not public service email", async () => {
            const username = "membre.nouveau";
            const primaryEmail = "membre.nouveau.new@example.com";
            isPublicServiceEmailStub.returns(Promise.resolve(false));
            getToken.returns(utils.getJWT("membre.nouveau"));

            await chai
                .request(app)
                .put(`/api/users/${username}/primary_email/`)
                .type("form")
                .send({
                    username,
                    primaryEmail: primaryEmail,
                });
            const dbNewRes = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.nouveau")
                .execute();
            dbNewRes.length.should.equal(1);
            dbNewRes[0].primary_email.should.not.equal(primaryEmail);
            isPublicServiceEmailStub.called.should.be.true;
            mattermostGetUserByEmailStub.calledOnce.should.be.false;
        });

        it("should not update primary email if email does not exist on mattermost", async () => {
            isPublicServiceEmailStub.returns(Promise.resolve(true));
            mattermostGetUserByEmailStub.returns(Promise.reject("404 error"));
            const username = "membre.nouveau";
            const primaryEmail = "membre.nouveau.new@example.com";
            getToken.returns(utils.getJWT("membre.nouveau"));
            await db
                .updateTable("users")
                .where("username", "=", "membre.nouveau")
                .set({
                    primary_email: `membre.nouveau@otherdomaine.gouv.fr`,
                })
                .execute();

            const res = await chai
                .request(app)
                .put(`/api/users/${username}/primary_email/`)
                .type("form")
                .send({
                    username,
                    primaryEmail: primaryEmail,
                });
            const dbNewRes = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.nouveau")
                .execute();
            dbNewRes.length.should.equal(1);
            dbNewRes[0].primary_email.should.not.equal(primaryEmail);

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
            const primaryEmail = "membre.nouveau.new@example.com";
            getToken.returns(utils.getJWT("membre.nouveau"));
            await db
                .updateTable("users")
                .where("username", "=", "membre.nouveau")
                .set({
                    primary_email: `admin@otherdomaine.gouv.fr`,
                })
                .execute();

            const res = await chai
                .request(app)
                .put(`/api/users/${username}/primary_email/`)
                .type("form")
                .send({
                    username,
                    primaryEmail: primaryEmail,
                });
            const dbNewRes = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.nouveau")
                .execute();
            dbNewRes.length.should.equal(1);
            dbNewRes[0].primary_email.should.not.equal(primaryEmail);

            mattermostGetUserByEmailStub.calledOnce.should.be.true;

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
            getToken.returns(utils.getJWT("membre.nouveau"));

            const res = await chai
                .request(app)
                .put(`/api/users/${username}/primary_email/`)
                .type("form")
                .send({
                    username,
                    primaryEmail: primaryEmail,
                });
            const dbNewRes = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "membre.nouveau")
                .execute();
            dbNewRes.length.should.equal(1);
            dbNewRes[0].primary_email.should.equal(primaryEmail);
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

    describe("Post delete /api/users/:username/email/delete authenticated", () => {
        let getToken;
        let isPublicServiceEmailStub;

        beforeEach(async () => {
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.actif"));
            await utils.createUsers(testUsers);
            isPublicServiceEmailStub = sinon
                .stub(controllerUtils, "isPublicServiceEmail")
                .returns(Promise.resolve(true));
        });

        afterEach(async () => {
            getToken.restore();
            await utils.deleteUsers(testUsers);
            isPublicServiceEmailStub.restore();
        });

        it("Deleting email should ask OVH to delete all redirections", (done) => {
            nock.cleanAll();

            nock(/.*ovh.com/)
                .get(/^.*email\/domain\/.*\/redirection/)
                .query((x) => Boolean(x.from || x.to))
                .reply(200, ["123123"])
                .persist();

            nock(/.*ovh.com/)
                .get(/^.*email\/domain\/.*\/redirection\/123123/)
                .reply(200, {
                    id: "123123",
                    from: `membre.expire@${config.domain}`,
                    to: "perso@example.ovh",
                })
                .persist();

            utils.mockUsers();
            utils.mockOvhTime();
            utils.mockOvhUserResponder();
            utils.mockOvhUserEmailInfos();
            utils.mockOvhAllEmailInfos();
            utils.mockSlackGeneral();
            utils.mockSlackSecretariat();

            const ovhRedirectionDeletion = nock(/.*ovh.com/)
                .delete(/^.*email\/domain\/.*\/redirection\/123123/)
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.expire/email/delete")
                .end((err, res) => {
                    ovhRedirectionDeletion.isDone().should.be.true;
                    done();
                });
        });

        it("should not allow email deletion for active users", (done) => {
            const ovhEmailDeletion = nock(/.*ovh.com/)
                .delete(/^.*email\/domain\/.*\/account\/membre.expire/)
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.actif/email/delete")
                .end((err, res) => {
                    ovhEmailDeletion.isDone().should.be.false;
                    done();
                });
        });

        it("should not allow email deletion for another user if active", (done) => {
            nock.cleanAll();

            const ovhEmailDeletion = nock(/.*ovh.com/)
                .delete(/^.*email\/domain\/.*\/account\/membre.actif/)
                .reply(200);

            utils.mockUsers();
            utils.mockOvhTime();
            utils.mockOvhUserResponder();
            utils.mockOvhUserEmailInfos();
            utils.mockOvhAllEmailInfos();
            utils.mockSlackGeneral();
            utils.mockSlackSecretariat();

            getToken.returns(utils.getJWT("membre.nouveau"));
            chai.request(app)
                .post("/api/users/membre.actif/email/delete")
                .end((err, res) => {
                    ovhEmailDeletion.isDone().should.be.false;
                    done();
                });
        });

        it("should allow email deletion for requester even if active", (done) => {
            nock.cleanAll();

            nock(/.*ovh.com/)
                .get(/^.*email\/domain\/.*\/redirection/)
                .query((x) => Boolean(x.from || x.to))
                .reply(200, ["123123"])
                .persist();

            nock(/.*ovh.com/)
                .get(/^.*email\/domain\/.*\/redirection\/123123/)
                .reply(200, {
                    id: "123123",
                    from: `membre.actif@${config.domain}`,
                    to: "perso@example.ovh",
                })
                .persist();

            const ovhEmailDeletion = nock(/.*ovh.com/)
                .delete(/^.*email\/domain\/.*\/account\/membre.actif/)
                .reply(200);

            utils.mockUsers();
            utils.mockOvhTime();
            utils.mockOvhUserResponder();
            utils.mockOvhUserEmailInfos();
            utils.mockOvhAllEmailInfos();
            utils.mockSlackGeneral();
            utils.mockSlackSecretariat();

            const ovhRedirectionDeletion = nock(/.*ovh.com/)
                .delete(/^.*email\/domain\/.*\/redirection\/123123/)
                .reply(200);

            chai.request(app)
                .post("/api/users/membre.actif/email/delete")
                .end((err, res) => {
                    ovhRedirectionDeletion.isDone().should.be.true;
                    done();
                });
        });
    });

    describe("cronjob", () => {
        before(async () => {
            await knex("marrainage").truncate();
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
            const users = [
                {
                    id: "membre.actif",
                    fullname: "membre Actif",
                    missions: [
                        {
                            start: "2016-11-03",
                            status: "independent",
                            employer: "octo",
                        },
                    ],
                },
                {
                    id: "membre.nouveau",
                    fullname: "membre Nouveau",
                    missions: [
                        {
                            start: new Date().toISOString().split("T")[0],
                        },
                    ],
                },
            ];
            beforeEach(async () => {
                await utils.createUsers(users);
            });
            afterEach(async () => {
                await utils.deleteUsers(users);
            });
            it("should create missing email accounts", async () => {
                utils.cleanMocks();
                // const url = process.env.USERS_API || "https://beta.gouv.fr";
                // nock(url)
                //     .get((uri) => uri.includes("authors.json"))
                //     .reply(200, [
                //         {
                //             id: "membre.actif",
                //             fullname: "membre Actif",
                //             missions: [
                //                 {
                //                     start: "2016-11-03",
                //                     status: "independent",
                //                     employer: "octo",
                //                 },
                //             ],
                //         },
                //         {
                //             id: "membre.nouveau",
                //             fullname: "membre Nouveau",
                //             missions: [
                //                 {
                //                     start: new Date()
                //                         .toISOString()
                //                         .split("T")[0],
                //                 },
                //             ],
                //         },
                //     ])
                //     .persist();
                utils.mockSlackGeneral();
                utils.mockSlackSecretariat();
                utils.mockOvhTime();
                utils.mockOvhRedirections();
                utils.mockOvhUserResponder();
                utils.mockOvhUserEmailInfos();
                utils.mockStartups();

                const newMember = testUsers.find(
                    (user) => user.id === "membre.nouveau"
                );
                const allAccountsExceptANewMember = testUsers.filter(
                    (user) => user.id !== newMember.id
                );

                nock(/.*ovh.com/)
                    .get(/^.*email\/domain\/.*\/account/)
                    .reply(
                        200,
                        allAccountsExceptANewMember.map((user) => user.id)
                    );
                const ovhEmailCreation = nock(/.*ovh.com/)
                    .post(/^.*email\/domain\/.*\/account/)
                    .reply(200);
                await knex("login_tokens").truncate();
                await db
                    .updateTable("users")
                    .where("username", "=", newMember.id)
                    .set({
                        primary_email: null,
                        primary_email_status:
                            EmailStatusCode.EMAIL_CREATION_WAITING,
                        secondary_email: "membre.nouveau.perso@example.com",
                    })
                    .execute();
                // const val = await db
                //     .updateTable("users")
                //     .selectAll()
                //     .set({
                //         username: newMember.id,
                //     })
                //     .execute();
                await createEmailAddresses();
                ovhEmailCreation.isDone().should.be.true;
                betagouvCreateEmail.firstCall.args[0].should.equal(
                    newMember.id
                );
                await db
                    .updateTable("users")
                    .where("username", "=", newMember.id)
                    .set({
                        secondary_email: null,
                        primary_email: `${newMember.id}@${config.domain}`,
                    })
                    .execute();
            });
        });

        context("", () => {});

        it("should not create email accounts if already created", async () => {
            // For this case we need to reset the basic nocks in order to return
            // a different response to indicate that newcomer.test has an
            // email address
            utils.cleanMocks();
            utils.mockUsers();
            utils.mockSlackGeneral();
            utils.mockSlackSecretariat();
            utils.mockOvhTime();
            utils.mockOvhRedirections();

            // We return an email for membre.nouveau to indicate he already has one
            const newMember = testUsers.find(
                (user) => user.id === "membre.nouveau"
            );

            nock(/.*ovh.com/)
                .get(/^.*email\/domain\/.*\/account/)
                .reply(200, [newMember]);

            const ovhEmailCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account/)
                .reply(200);

            await createEmailAddresses();
            betagouvCreateEmail.notCalled.should.be.true;
            ovhEmailCreation.isDone().should.be.false;
        });

        it("should not create email accounts if we dont have the secondary email", async () => {
            const ovhEmailCreation = nock(/.*ovh.com/)
                .post(/^.*email\/domain\/.*\/account/)
                .reply(200);

            await createEmailAddresses();
            betagouvCreateEmail.notCalled.should.be.true;
            ovhEmailCreation.isDone().should.be.false;
        });
        describe("", () => {
            const users = [
                {
                    id: "membre.nouveau",
                    fullname: "membre Nouveau",
                    missions: [
                        {
                            start: new Date().toISOString().split("T")[0],
                        },
                    ],
                },
            ];
            beforeEach(async () => {
                await utils.createUsers(users);
            });
            afterEach(async () => {
                await utils.deleteUsers(users);
            });
            it("should subscribe user to incubateur mailing list", async () => {
                const url = process.env.USERS_API || "https://beta.gouv.fr";
                utils.cleanMocks();
                utils.mockSlackGeneral();
                utils.mockSlackSecretariat();
                utils.mockOvhTime();
                utils.mockOvhRedirections();
                // nock(url)
                //     .get((uri) => uri.includes("authors.json"))
                //     .reply(200, [
                //         {
                //             id: "membre.nouveau",
                //             fullname: "membre Nouveau",
                //             missions: [
                //                 {
                //                     start: new Date().toISOString().split("T")[0],
                //                 },
                //             ],
                //         },
                //     ]);
                const subscribeSpy = sinon.spy(
                    Betagouv,
                    "subscribeToMailingList"
                );
                const newMember = testUsers.find(
                    (user) => user.id === "membre.nouveau"
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
                    config.incubateurMailingListName
                );
                subscribeSpy.firstCall.args[1].should.equal(
                    `membre.nouveau@${config.domain}`
                );
                subscribeSpy.restore();
            });
        });

        context(
            "should unsubscribe user from incubateur mailing list",
            async () => {
                let users = [
                    {
                        id: "membre.nouveau",
                        fullname: "membre Nouveau",
                        missions: [
                            {
                                start: new Date("12/01/1990")
                                    .toISOString()
                                    .split("T")[0],
                                end: new Date("12/01/1991")
                                    .toISOString()
                                    .split("T")[0],
                            },
                        ],
                    },
                ];
                let unsubscribeSpy;
                beforeEach(async () => {
                    await utils.createUsers(users);
                    utils.cleanMocks();
                    utils.mockSlackGeneral();
                    utils.mockSlackSecretariat();
                    utils.mockOvhTime();
                    utils.mockOvhRedirections();
                    unsubscribeSpy = sinon.spy(
                        Betagouv,
                        "unsubscribeFromMailingList"
                    );
                });
                afterEach(async () => {
                    await utils.deleteUsers(users);
                    unsubscribeSpy.restore();
                });

                it("ovhMailingListUnsubscription should be called", async () => {
                    const url = process.env.USERS_API || "https://beta.gouv.fr";

                    // nock(url)
                    //     .get((uri) => uri.includes("authors.json"))
                    //     .reply(200, [
                    //         {
                    //             id: "membre.nouveau",
                    //             fullname: "membre Nouveau",
                    //             missions: [
                    //                 {
                    //                     end: new Date("12/01/1991")
                    //                         .toISOString()
                    //                         .split("T")[0],
                    //                 },
                    //             ],
                    //         },
                    //     ]);

                    const newMember = testUsers.find(
                        (user) => user.id === "membre.nouveau"
                    );
                    nock(/.*ovh.com/)
                        .get(/^.*email\/domain\/.*\/account/)
                        .reply(200, [newMember]);
                    nock(/.*ovh.com/)
                        .get(
                            /^.*email\/domain\/.*\/mailingList\/.*\/subscriber/
                        )
                        .reply(200, [`membre.nouveau@${config.domain}`]);
                    const ovhMailingListUnsubscription = nock(/.*ovh.com/)
                        .delete(
                            /^.*email\/domain\/.*\/mailingList\/.*\/subscriber.*/
                        )
                        .reply(200)
                        .persist();

                    await unsubscribeEmailAddresses();
                    ovhMailingListUnsubscription.isDone().should.be.true;
                    unsubscribeSpy.firstCall.args[0].should.equal(
                        config.incubateurMailingListName
                    );
                    unsubscribeSpy.firstCall.args[1].should.equal(
                        `membre.nouveau@${config.domain}`
                    );
                });
            }
        );
        context("should create redirection missing email accounts", () => {
            let users = [
                {
                    id: "membre.actif",
                    fullname: "membre Actif",
                    missions: [
                        {
                            start: "2016-11-03",
                            status: "independent",
                            employer: "octo",
                        },
                    ],
                },
                {
                    id: "membre.nouveau",
                    fullname: "membre Nouveau",
                    missions: [
                        {
                            start: new Date().toISOString().split("T")[0],
                        },
                    ],
                },
            ];
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
                await utils.createUsers(users);
            });
            afterEach(async () => {
                createRedirection.restore();
                await utils.deleteUsers(users);
            });

            it("should create redirection missing email accounts", async () => {
                const ovhRedirectionCreation = nock(/.*ovh.com/)
                    .post(/^.*email\/domain\/.*\/redirection/)
                    .reply(200);
                await knex("login_tokens").truncate();
                const newMember = testUsers.find(
                    (user) => user.id === "membre.nouveau"
                );
                const allAccountsExceptANewMember = testUsers.filter(
                    (user) => user.id !== newMember.id
                );

                nock(/.*ovh.com/)
                    .get(/^.*email\/domain\/.*\/redirection/)
                    .reply(
                        200,
                        allAccountsExceptANewMember.map((user) => user.id)
                    );
                nock(/.*ovh.com/)
                    .get(/^.*email\/domain\/.*\/account/)
                    .reply(
                        200,
                        allAccountsExceptANewMember.map((user) => user.id)
                    );
                await db
                    .updateTable("users")
                    .where("username", "=", newMember.id)
                    .set({
                        primary_email: null,
                        primary_email_status:
                            EmailStatusCode.EMAIL_CREATION_WAITING,
                        secondary_email: "membre.nouveau.perso@example.com",
                        email_is_redirection: true,
                    })
                    .execute();
                const val = await db
                    .selectFrom("users")
                    .selectAll()
                    .where("username", "=", newMember.id)
                    .execute();
                await createEmailAddresses();
                ovhRedirectionCreation.isDone().should.be.false;
                await createRedirectionEmailAdresses();
                ovhRedirectionCreation.isDone().should.be.true;
                createRedirection.firstCall.args[0].should.equal(
                    `${newMember.id}-attr@${config.domain}`
                );
                createRedirection.calledOnce.should.be.true;
                await db
                    .updateTable("users")
                    .where("username", "=", newMember.id)
                    .set({
                        secondary_email: null,
                        primary_email: `${newMember.id}@${config.domain}`,
                        email_is_redirection: false,
                    })
                    .execute();
            });
        });
    });

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
            const users = [
                {
                    id: "membre.nouveau-email",
                    domaine: Domaine.ANIMATION,
                    role: "",
                    fullname: "Membre Nouveau-email",
                    primary_email: null,
                    primary_email_status: EmailStatusCode.EMAIL_UNSET,
                    secondary_email: "membre.nouveau-email.perso@example.com",
                    end: "2024-12-03",
                    start: "2023-12-03",
                },
            ];
            beforeEach(async () => {
                return utils.createUsers(users);
            });
            afterEach(async () => {
                return utils.deleteUsers(users);
            });
            it("should create an OVH MX Plan account", async () => {
                await createEmail("membre.nouveau-email", "Test");
                Betagouv.createEmail.calledWith("membre.nouveau-email").should
                    .be.true;
            });
        });

        context("when the user needs an OVH Pro account", () => {
            let users = [
                {
                    id: "membre.nouveau-email",
                    username: "membre.nouveau-email",
                    primary_email: null,
                    primary_email_status: EmailStatusCode.EMAIL_UNSET,
                    secondary_email: "membre.nouveau-email.perso@example.com",
                    domaine: Domaine.ANIMATION,
                    role: "",
                    fullname: "Membre Nouveau test email",
                    missions: [
                        {
                            end: "2024-12-03",
                            start: "2023-12-03",
                            status: "independent",
                            employer: "octo",
                            startups: [],
                        },
                    ],
                },
            ];
            beforeEach(async () => {
                await utils.createUsers(users);
                sandbox
                    .stub(config, "EMAIL_DEFAULT_PLAN")
                    .value(EMAIL_PLAN_TYPE.EMAIL_PLAN_PRO);
            });
            afterEach(async () => {
                await utils.deleteUsers(users);
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
            const users = [
                {
                    id: "membre.nouveau-email",
                    domaine: Domaine.ANIMATION,
                    role: "",
                    fullname: "Membre Nouveau test email",
                    primary_email: null,
                    primary_email_status: EmailStatusCode.EMAIL_UNSET,
                    secondary_email: "membre.nouveau-email.perso@example.com",
                    missions: [
                        {
                            id: "membre.nouveau-email",
                            end: "2024-12-03",
                            start: "2023-12-03",
                            startups: ["a-startup-at-gip"],
                        },
                    ],
                },
            ];
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
                await utils.createUsers(users);
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
                await utils.deleteUsers(users);
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

                Betagouv.createEmailForExchange.firstCall.args.should.deep.equal(
                    [
                        "membre.nouveau-email",
                        {
                            displayName: "Membre Nouveau test email",
                            firstName: "Membre",
                            lastName: "Nouveau test email",
                        },
                    ]
                );
            });
        });
    });
});
