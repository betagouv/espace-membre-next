import chai from "chai";
import chaiHttp from "chai-http";
import sinon from "sinon";

import testUsers from "./users.json";
import utils from "./utils";
import routes from "@/routes/routes";
import config from "@/server/config";
import * as adminConfig from "@/server/config/admin.config";
import * as session from "@/server/helpers/session";
import app from "@/server/index";
import * as sendMattermostMessage from "@controllers/adminController/sendMattermostMessage";
import * as chat from "@infra/chat";
import * as mattermostScheduler from "@schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam";

chai.use(chaiHttp);

describe("Test Admin", () => {
    describe("GET /admin unauthenticated", () => {
        it("should redirect to login", (done) => {
            chai.request(app)
                .get("/api/admin")
                .redirects(0)
                .end((err, res) => {
                    res.should.have.status(500);
                    done();
                });
        });
    });

    // describe("GET /admin authenticated", () => {
    //     let getToken;

    //     beforeEach(() => {
    //         getToken = sinon.stub(session, "getToken");
    //         getToken.returns(utils.getJWT("membre.actif"));
    //     });

    //     afterEach(() => {
    //         getToken.restore();
    //     });
    //     it("should return a valid page", (done) => {
    //         chai.request(app)
    //             .get("/api/admin")
    //             .end((err, res) => {
    //                 res.should.have.status(200);
    //                 done();
    //             });
    //     });
    // });

    describe("GET /admin/mattermost authenticated", () => {
        let getToken;

        beforeEach(async () => {
            getToken = sinon.stub(session, "getToken");
            getToken.returns(utils.getJWT("membre.actif"));
            await utils.createUsers(testUsers);
        });

        afterEach(async () => {
            getToken.restore();
            await utils.deleteUsers(testUsers);
        });
        it("should return a forbidden error if user not in admin", async () => {
            const res = await chai
                .request(app)
                .get(routes.ADMIN_MATTERMOST_API);
            res.should.have.status(403);
        });
        it("should return a forbidden error if user not in admin", async () => {
            const res = await chai
                .request(app)
                .get(routes.ADMIN_MATTERMOST_MESSAGE_API);
            res.should.have.status(403);
        });
        it("should return a forbidden error if user not in admin", async () => {
            const res = await chai
                .request(app)
                .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE);
            res.should.have.status(403);
        });
        it("should return /api/admin/mattermost page if user is admin", async () => {
            const getAdminStub = sinon
                .stub(adminConfig, "getAdmin")
                .returns(["membre.actif"]);
            const getMattermostUsersWithStatus = sinon
                .stub(mattermostScheduler, "getMattermostUsersWithStatus")
                .returns(Promise.resolve([]));
            const res = await chai
                .request(app)
                .get(routes.ADMIN_MATTERMOST_API);
            res.should.have.status(200);
            getAdminStub.restore();
            getMattermostUsersWithStatus.restore();
        });
        it("should return /admin/send-message page if user is admin", async () => {
            const getAdminStub = sinon
                .stub(adminConfig, "getAdmin")
                .returns(["membre.actif"]);
            const getMattermostUsersWithStatus = sinon
                .stub(mattermostScheduler, "getMattermostUsersWithStatus")
                .returns(Promise.resolve([]));
            const getUserWithParams = sinon.stub(chat, "getUserWithParams");
            const sendInfoToChat = sinon.stub(chat, "sendInfoToChat");
            getUserWithParams.onCall(0).returns([
                {
                    username: "membre.actif",
                    email: `membre.actif@${config.domain}`,
                },
            ]);
            getUserWithParams.onCall(1).returns([]);
            const res = await chai
                .request(app)
                .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE)
                .send({
                    fromBeta: true,
                    excludeEmails: "",
                    includeEmails: "",
                    text: "",
                });
            res.should.have.status(200);
            sendInfoToChat.calledOnce.should.be.true;
            getUserWithParams.callCount.should.be.eq(0);
            getAdminStub.restore();
            getUserWithParams.restore();
            getMattermostUsersWithStatus.restore();
            sendInfoToChat.restore();
        });
        it("should send message to all users if prod is true and channel undefined", async () => {
            const getAdminStub = sinon
                .stub(adminConfig, "getAdmin")
                .returns(["membre.actif"]);
            const getMattermostUsersWithStatus = sinon
                .stub(mattermostScheduler, "getMattermostUsersWithStatus")
                .returns(Promise.resolve([]));
            const getUserWithParams = sinon.stub(chat, "getUserWithParams");
            const sendInfoToChat = sinon.stub(chat, "sendInfoToChat");
            getUserWithParams.onCall(0).returns([
                {
                    username: "membre.actif",
                    email: `membre.actif@${config.domain}`,
                },
            ]);
            getUserWithParams.onCall(1).returns([]);
            const res = await chai
                .request(app)
                .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE)
                .send({
                    fromBeta: true,
                    excludeEmails: "",
                    includeEmails: "",
                    prod: true,
                });
            res.should.have.status(200);
            getUserWithParams.callCount.should.be.eq(1);
            getAdminStub.restore();
            getUserWithParams.restore();
            getMattermostUsersWithStatus.restore();
            sendInfoToChat.restore();
        });

        it("should take exclude in consideration", async () => {
            const getAdminStub = sinon
                .stub(adminConfig, "getAdmin")
                .returns(["membre.actif"]);
            const getMattermostUsersWithStatus = sinon
                .stub(mattermostScheduler, "getMattermostUsersWithStatus")
                .returns(Promise.resolve([]));
            const getMattermostUsersSpy = sinon.spy(
                sendMattermostMessage,
                "getMattermostUsers"
            );
            const getUserWithParams = sinon.stub(chat, "getUserWithParams");
            const sendInfoToChat = sinon.stub(chat, "sendInfoToChat");
            getUserWithParams.onCall(0).returns([
                {
                    username: "membre.actif",
                    email: `membre.actif@${config.domain}`,
                },
            ]);
            getUserWithParams.onCall(1).returns([]);
            const res = await chai
                .request(app)
                .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE)
                .send({
                    fromBeta: true,
                    includeEmails: "",
                    prod: true,
                });
            res.should.have.status(200);
            const resMatterUser = await getMattermostUsersSpy.returnValues[0];
            resMatterUser.length.should.be.eq(1);
            getUserWithParams.callCount.should.be.eq(1);
            getAdminStub.restore();
            getUserWithParams.restore();
            getMattermostUsersWithStatus.restore();
            sendInfoToChat.restore();
        });

        it("should send message to all users if prod is true and channel set", async () => {
            const getAdminStub = sinon
                .stub(adminConfig, "getAdmin")
                .returns(["membre.actif"]);
            const getMattermostUsersWithStatus = sinon
                .stub(mattermostScheduler, "getMattermostUsersWithStatus")
                .returns(Promise.resolve([]));
            const getUserWithParams = sinon.stub(chat, "getUserWithParams");
            const sendInfoToChat = sinon.stub(chat, "sendInfoToChat");
            getUserWithParams.onCall(0).returns([
                {
                    username: "membre.actif",
                    email: `membre.actif@${config.domain}`,
                },
            ]);
            getUserWithParams.onCall(1).returns([]);
            const res = await chai
                .request(app)
                .post(routes.ADMIN_MATTERMOST_SEND_MESSAGE)
                .send({
                    fromBeta: true,
                    excludeEmails: "",
                    prod: true,
                    channel: "general",
                });
            res.should.have.status(200);
            getUserWithParams.callCount.should.be.eq(0);
            sendInfoToChat.getCall(0).args[0].channel.should.equal("general");
            sendInfoToChat.calledTwice.should.be.true;
            getAdminStub.restore();
            getUserWithParams.restore();
            getMattermostUsersWithStatus.restore();
            sendInfoToChat.restore();
        });
    });
});
