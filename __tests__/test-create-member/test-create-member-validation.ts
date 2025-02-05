import { addDays, subDays } from "date-fns";
import PgBoss from "pg-boss";
import proxyquire from "proxyquire";
import sinon from "sinon";

import testUsers from "../users.json";
import utils from "../utils";
import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { SendNewMemberValidationEmailSchemaType } from "@/models/jobs/member";
import { memberPublicInfoToModel } from "@/models/mapper";
import { Domaine, EmailStatusCode } from "@/models/member";
import { EMAIL_TYPES } from "@/server/modules/email";

describe(`A new member cannot be validated by someone who is not an incubator's team member`, () => {
    let sendEmailStub, getServerSessionStub, sendNewMemberValidationEmail;
    let newUser,
        newIncubatorA,
        newIncubatorB,
        newMission,
        newStartupMissionConnexion,
        newStartup,
        teamA,
        teamB,
        userA,
        userB;
    beforeEach(async () => {
        getServerSessionStub = sinon.stub();
        await utils.createUsers(testUsers);
        sendEmailStub = sinon.stub().resolves(); // Resolves like a real async function
        // Use proxyquire to replace bossClient module
        sendNewMemberValidationEmail = proxyquire(
            "@/server/queueing/workers/send-validation-email",
            {
                "@/server/config/email.config": { sendEmail: sendEmailStub },
            }
        ).sendNewMemberValidationEmail;
        newIncubatorB = await db
            .insertInto("incubators")
            .values({
                title: "un autre incubator",
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        newUser = await db
            .insertInto("users")
            .values({
                fullname: "Annie Mation",
                secondary_email: "annie.mation@gmail.com",
                role: "Cheffe",
                username: "annie.mation",
                domaine: Domaine.ANIMATION,
            })
            .returningAll()
            .executeTakeFirstOrThrow();

        // mission linked to an incubator
        newMission = await db
            .insertInto("missions")
            .values({
                start: subDays(new Date(), 3),
                end: addDays(new Date(), 4),
                user_id: newUser.uuid,
            })
            .returningAll()
            .executeTakeFirstOrThrow();

        newStartup = await utils.createStartup(
            newIncubatorB.uuid,
            "seconda-startup-name"
        );
        // the mission is also link to a startup and to another incubator
        newStartupMissionConnexion = await db
            .insertInto("missions_startups")
            .values({
                mission_id: newMission.uuid,
                startup_id: newStartup.uuid,
            })
            .execute();
        // add user A to team A
        userA = await db
            .selectFrom("users")
            .where("username", "=", "membre.actif")
            .selectAll()
            .executeTakeFirstOrThrow();
        teamA = await db
            .insertInto("teams")
            .values({
                name: "Dinum Team",
                incubator_id: newIncubatorA.uuid,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        await db
            .insertInto("users_teams")
            .values({
                user_id: userA.uuid,
                team_id: teamA.uuid,
            })
            .execute();
        // add user B to team B
        userB = await db
            .selectFrom("users")
            .where("username", "=", "julien.dauphant")
            .selectAll()
            .executeTakeFirstOrThrow();
    });

    afterEach(async () => {
        await utils.deleteUsers(testUsers);
        await db
            .deleteFrom("startups")
            .where("uuid", "=", newStartup.uuid)
            .execute();
        await db
            .deleteFrom("incubators")
            .where("uuid", "=", newIncubatorA.uuid)
            .execute();
        await db
            .deleteFrom("incubators")
            .where("uuid", "=", newIncubatorB.uuid)
            .execute();
        await db.deleteFrom("teams").where("uuid", "=", teamA.uuid).execute();
        await db.deleteFrom("teams").where("uuid", "=", teamB.uuid).execute();
        await db.deleteFrom("users").where("uuid", "=", newUser.uuid).execute();
        await db
            .deleteFrom("missions")
            .where("uuid", "=", newMission.uuid)
            .execute();
    });
    it("should send forbidden error if an unthorized member try to validate link", async function (_) {
        const validateUser = proxyquire("@/api/member/actions", {
            "next-auth": { getServerSession: getServerSessionStub },
            "@/server/config/email.config": { sendEmail: sendEmailStub },
        }).validateUser;
        try {
            await validateUser({ userId: newUser.id });
        } catch (error) {
            if (error instanceof Error) {
                error.message = "You should be connected to do this action";
            }
        }
        const updatedUser = await db
            .selectFrom("users")
            .where("username", "=", newUser.id)
            .selectAll()
            .executeTakeFirstOrThrow();
        updatedUser?.primary_email_status?.should.equals(
            EmailStatusCode.MEMBER_VALIDATION_WAITING
        );
    });
    it("should send forbidden error if an unthorized member try to validate link", async function () {
        getServerSessionStub = sinon.stub();
        const mockSession = {
            user: { id: userB.ghid, isAdmin: false, uuid: userB.uuid },
        };
        getServerSessionStub.resolves(mockSession);
        const validateUser = proxyquire("@/api/member/actions", {
            "next-auth": { getServerSession: getServerSessionStub },
            "@/server/config/email.config": { sendEmail: sendEmailStub },
        }).validateUser;
        try {
            await validateUser({ userId: newUser.id });
        } catch (error) {
            if (error instanceof Error) {
                error.message = `You should be a member of the incubator's team to do this action`;
            }
        }
        const updatedUser = await db
            .selectFrom("users")
            .where("username", "=", newUser.id)
            .selectAll()
            .executeTakeFirstOrThrow();
        updatedUser?.primary_email_status?.should.equals(
            EmailStatusCode.MEMBER_VALIDATION_WAITING
        );
    });
    it("should send authorized member of incubator teams to validation user", async function (_) {
        const mockSession = {
            user: { id: userA.ghid, isAdmin: false, uuid: userA.uuid },
        };
        getServerSessionStub.resolves(mockSession);
        const validateUser = proxyquire("@/api/member/actions", {
            "next-auth": { getServerSession: getServerSessionStub },
            "@/server/config/email.config": { sendEmail: sendEmailStub },
        }).validateUser;
        try {
            await validateUser({ userId: newUser.id });
        } catch (error) {
            if (error instanceof Error) {
                error.message = `You should be a member of the incubator's team to do this action`;
            }
        }
        const updatedUser = await db
            .selectFrom("users")
            .where("username", "=", newUser.id)
            .selectAll()
            .executeTakeFirstOrThrow();
        updatedUser?.primary_email_status?.should.equals(
            EmailStatusCode.EMAIL_VERIFICATION_WAITING
        );
    });
});
