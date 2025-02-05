import chai from "chai";
import { createMocks } from "node-mocks-http";
import proxyquire from "proxyquire";
import sinon from "sinon";

import testUsers from "../users.json";
import utils from "../utils";
import { db } from "@/lib/kysely";
import { createMemberSchemaType } from "@/models/actions/member";
import { Domaine, EmailStatusCode } from "@/models/member";
import { sendNewMemberValidationEmailTopic } from "@/server/queueing/workers/send-validation-email";
const expect = chai.expect;

const createMemberObj: createMemberSchemaType = {
    member: {
        firstname: "Annie",
        lastname: "Mation",
        email: "annie.mation@gmail.com",
        domaine: Domaine.ANIMATION,
    },
    missions: [
        {
            start: new Date(),
        },
    ],
};

describe("Test creating new user flow", () => {
    let sendStub, bossClientStub, getServerSessionStub, createNewMemberHandler;
    beforeEach(async () => {
        getServerSessionStub = sinon.stub();
        await utils.createUsers(testUsers);
        sendStub = sinon.stub().resolves(); // Resolves like a real async function
        bossClientStub = { send: sendStub };
        // Use proxyquire to replace bossClient module
        createNewMemberHandler = proxyquire("@/app/api/member/route", {
            "next-auth": { getServerSession: getServerSessionStub },
            "next/cache": { revalidatePath: sinon.stub().resolves() },
            "@/server/queueing/client": {
                getBossClientInstance: sinon.stub().resolves(bossClientStub),
            },
            "@/server/controllers/utils": {
                isPublicServiceEmail: sinon
                    .stub()
                    .returns(Promise.resolve(true)),
            },
        }).POST;
    });

    afterEach(async () => {
        await utils.deleteUsers(testUsers);
    });

    it("should create new user", async () => {
        const mockSession = {
            user: { id: "anyuser", isAdmin: true, uuid: "anyuser-uuid" },
        };
        getServerSessionStub.resolves(mockSession);
        const { req } = createMocks({
            method: "POST",
            json: async () => ({
                ...createMemberObj,
            }),
        });

        await createNewMemberHandler(req, {
            params: {
                ...createMemberObj,
            },
        });
        sendStub.called.should.be.true;
        console.log(sendStub.call, sendStub.called);
        sendStub.firstCall.args[0].should.equal(
            sendNewMemberValidationEmailTopic
        );
        const newDbUser = await db
            .selectFrom("users")
            .selectAll()
            .where("username", "=", "annie.mation")
            .executeTakeFirst();
        expect(newDbUser).to.exist;
        expect(newDbUser?.primary_email_status).to.equals(
            EmailStatusCode.MEMBER_VALIDATION_WAITING
        );
        const newDbMission = await db
            .selectFrom("missions")
            .selectAll()
            .where("user_id", "=", newDbUser?.uuid!)
            .executeTakeFirst();
        expect(newDbMission).to.exist;
        sendStub.firstCall.args[1].should.deep.equal({
            userId: newDbUser?.uuid,
        });
    });
});
