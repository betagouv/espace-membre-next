import chai, { assert, expect } from "chai";
import chaiHttp from "chai-http";
import * as nextAuth from "next-auth/next";
import sinon from "sinon";

import utils from "./utils";
import { createData, deleteData } from "./utils/fakeData";
import { testUsers } from "./utils/users-data";
import { getMattermostInfo } from "@/app/api/admin/actions/getMattermostAdmin";
import { getMattermostUsersInfo } from "@/app/api/admin/actions/getMattermostUsersInfo";
import { sendMessageToUsersOnChat } from "@/app/api/admin/actions/sendMattermostMessage";
import { db } from "@/lib/kysely";
import config from "@/server/config";
import * as adminConfig from "@/server/config/admin.config";
import * as session from "@/server/helpers/session";
import * as sendMattermostMessage from "@controllers/adminController/sendMattermostMessage";
import * as chat from "@infra/chat";
import * as mattermostScheduler from "@schedulers/mattermostScheduler/removeBetaAndParnersUsersFromCommunityTeam";

chai.use(chaiHttp);

describe("Test Admin", () => {
    describe("Test admin mattermost server action", () => {
        describe("Test admin mattermost server action api if user is not admin", () => {
            let getServerSessionStub;
            let isPublicServiceEmailStub;
            let user;

            beforeEach(async () => {
                getServerSessionStub = sinon
                    .stub(nextAuth, "getServerSession")
                    .resolves({});

                await createData(testUsers);
                user = await db
                    .selectFrom("users")
                    .selectAll()
                    .where("username", "=", "membre.actif")
                    .executeTakeFirstOrThrow();
                const mockSession = {
                    user: {
                        id: "membre.actif",
                        isAdmin: false,
                        uuid: user.uuid,
                    },
                };
                getServerSessionStub.resolves(mockSession);
            });
            afterEach(async () => {
                sinon.restore();
                await deleteData(testUsers);
            });

            it("should return a forbidden error if user not in admin", async () => {
                try {
                    await getMattermostInfo();
                } catch (err) {
                    assert(err instanceof Error);
                    assert.strictEqual(
                        err.message,
                        "L'utilisateur doit être administrateur"
                    );
                }
            });
            it("should return a forbidden error if user not in admin", async () => {
                try {
                    await getMattermostUsersInfo({
                        fromBeta: true,
                    });
                } catch (err) {
                    assert(err instanceof Error);
                    assert.strictEqual(
                        err.message,
                        "L'utilisateur doit être administrateur"
                    );
                }
            });
            it("should return a forbidden error if user not in admin", async () => {
                try {
                    await sendMessageToUsersOnChat({
                        text: "toto",
                        fromBeta: false,
                    });
                } catch (err) {
                    assert(err instanceof Error);
                    assert.strictEqual(
                        err.message,
                        "L'utilisateur doit être administrateur"
                    );
                }
            });
        });
        describe("Test admin mattermost server action api if user is admin", () => {
            let getServerSessionStub;
            let user;

            beforeEach(async () => {
                getServerSessionStub = sinon
                    .stub(nextAuth, "getServerSession")
                    .resolves({});

                await utils.createData(testUsers);
                user = await db
                    .selectFrom("users")
                    .selectAll()
                    .where("username", "=", "membre.actif")
                    .executeTakeFirstOrThrow();
                const mockSession = {
                    user: {
                        id: "membre.actif",
                        isAdmin: true,
                        uuid: user.uuid,
                    },
                };
                getServerSessionStub.resolves(mockSession);
            });
            afterEach(async () => {
                sinon.restore();
                await utils.deleteData(testUsers);
            });

            it("should return /api/admin/mattermost page if user is admin", async () => {
                const getAdminStub = sinon
                    .stub(adminConfig, "getAdmin")
                    .returns(["membre.actif"]);
                const getMattermostUsersWithStatus = sinon
                    .stub(mattermostScheduler, "getMattermostUsersWithStatus")
                    .returns(Promise.resolve([]));
                const res = await getMattermostInfo();
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
                await sendMessageToUsersOnChat({
                    fromBeta: true,
                    text: "",
                });

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
                await sendMessageToUsersOnChat({
                    fromBeta: true,
                    prod: true,
                    text: "toto",
                });
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
                await sendMessageToUsersOnChat({
                    fromBeta: true,
                    excludeEmails: [`membre.actif@${config.domain}`],
                    prod: true,
                    text: "",
                });
                const resMatterUser = await getMattermostUsersSpy
                    .returnValues[0];
                resMatterUser.length.should.be.eq(0);
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
                await sendMessageToUsersOnChat({
                    fromBeta: true,
                    prod: true,
                    channel: "general",
                    text: "Un super texte",
                });
                getUserWithParams.callCount.should.be.eq(0);
                sendInfoToChat
                    .getCall(0)
                    .args[0].channel.should.equal("general");
                sendInfoToChat.calledTwice.should.be.true;
                getAdminStub.restore();
                getUserWithParams.restore();
                getMattermostUsersWithStatus.restore();
                sendInfoToChat.restore();
            });
        });
    });
});
