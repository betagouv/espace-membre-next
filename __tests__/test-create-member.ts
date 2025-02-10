import chai from "chai";
import { Selectable } from "kysely/dist/cjs/util/column-type";
import { createMocks } from "node-mocks-http";
import proxyquire from "proxyquire";
import sinon from "sinon";

import testUsers from "./users.json";
import utils from "./utils";
import { Users } from "@/@types/db";
import { db } from "@/lib/kysely";
import { createMemberSchemaType } from "@/models/actions/member";
import { Domaine, EmailStatusCode } from "@/models/member";
import { sendNewMemberValidationEmailTopic } from "@/server/queueing/workers/send-validation-email";
const expect = chai.expect;

describe("Test creating new user flow", () => {
    let sendStub,
        bossClientStub,
        getServerSessionStub,
        createNewMemberHandler,
        newIncubatorB,
        newStartup,
        teamA,
        userInATeamFromIncubator;
    let userThatIsNotInAnyTeam: Selectable<Users>;
    let createMemberObj: createMemberSchemaType;

    beforeEach(async () => {
        getServerSessionStub = sinon.stub();
        await utils.createUsers(testUsers);
        newIncubatorB = await db
            .insertInto("incubators")
            .values({
                title: "un autre incubator",
            })
            .returningAll()
            .executeTakeFirstOrThrow();

        // add user A to team A
        userInATeamFromIncubator = await db
            .selectFrom("users")
            .where("username", "=", "membre.actif")
            .selectAll()
            .executeTakeFirstOrThrow();
        teamA = await db
            .insertInto("teams")
            .values({
                name: "Dinum Team",
                incubator_id: newIncubatorB.uuid,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        await db
            .insertInto("users_teams")
            .values({
                user_id: userInATeamFromIncubator.uuid,
                team_id: teamA.uuid,
            })
            .execute();
        // user B is not in any team
        userThatIsNotInAnyTeam = await db
            .selectFrom("users")
            .where("username", "=", "julien.dauphant")
            .selectAll()
            .executeTakeFirstOrThrow();
        newStartup = await utils.createStartup(
            newIncubatorB.uuid,
            "seconda-startup-name"
        );
        createMemberObj = {
            member: {
                firstname: "Annie",
                lastname: "Mation",
                email: "annie.mation@gmail.com",
                domaine: Domaine.ANIMATION,
            },
            missions: [
                {
                    start: new Date(),
                    startups: [newStartup.uuid],
                },
            ],
        };

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
        await db.deleteFrom("users").execute();
        await db
            .deleteFrom("startups")
            .where("uuid", "=", newStartup.uuid)
            .execute();
        await db
            .deleteFrom("incubators")
            .where("uuid", "=", newIncubatorB.uuid)
            .execute();
        await db.deleteFrom("teams").where("uuid", "=", teamA.uuid).execute();
    });

    it("should create new user when requested by basic member", async () => {
        const mockSession = {
            user: {
                id: "anyuser",
                isAdmin: false,
                uuid: userThatIsNotInAnyTeam.uuid,
            },
        };
        getServerSessionStub.resolves(mockSession);
        const { req } = createMocks({
            method: "POST",
            json: async () => ({
                ...createMemberObj,
            }),
        });

        await createNewMemberHandler(req, {
            params: {},
        });
        sendStub.called.should.be.true;
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

    it("should create new user without validation when sesson user is admin", async () => {
        const mockSession = {
            user: {
                id: "anyuser",
                isAdmin: true,
                uuid: userInATeamFromIncubator.uuid,
            },
        };
        getServerSessionStub.resolves(mockSession);
        const { req } = createMocks({
            method: "POST",
            json: async () => ({
                ...createMemberObj,
            }),
        });

        await createNewMemberHandler(req, {
            params: {},
        });
        sendStub.called.should.be.false;
        const newDbUser = await db
            .selectFrom("users")
            .selectAll()
            .where("username", "=", "annie.mation")
            .executeTakeFirst();
        expect(newDbUser).to.exist;
        expect(newDbUser?.primary_email_status).to.equals(
            EmailStatusCode.EMAIL_VERIFICATION_WAITING
        );
        const newDbMission = await db
            .selectFrom("missions")
            .selectAll()
            .where("user_id", "=", newDbUser?.uuid!)
            .executeTakeFirst();
        expect(newDbMission).to.exist;
    });

    describe("", () => {
        let sendEmailStub, sendNewMemberValidationEmail;
        beforeEach(async () => {
            sendEmailStub = sinon.stub().resolves(); // Resolves like a real async function
            // Use proxyquire to replace bossClient module
            sendNewMemberValidationEmail = proxyquire(
                "@/server/queueing/workers/send-validation-email",
                {
                    "@/server/config/email.config": {
                        sendEmail: sendEmailStub,
                    },
                }
            ).sendNewMemberValidationEmail;
        });

        it("should create new user without validation when session user is from incubator team", async () => {
            const mockSession = {
                user: {
                    id: "anyuser",
                    isAdmin: false,
                    uuid: userInATeamFromIncubator.uuid,
                },
            };
            getServerSessionStub.resolves(mockSession);
            const { req } = createMocks({
                method: "POST",
                json: async () => ({
                    ...createMemberObj,
                }),
            });

            await createNewMemberHandler(req, {
                params: {},
            });
            sendStub.called.should.be.false;
            const newDbUser = await db
                .selectFrom("users")
                .selectAll()
                .where("username", "=", "annie.mation")
                .executeTakeFirst();
            expect(newDbUser).to.exist;
            expect(newDbUser?.primary_email_status).to.equals(
                EmailStatusCode.EMAIL_VERIFICATION_WAITING
            );
            const newDbMission = await db
                .selectFrom("missions")
                .selectAll()
                .where("user_id", "=", newDbUser?.uuid!)
                .executeTakeFirst();
            expect(newDbMission).to.exist;
        });
    });
});
