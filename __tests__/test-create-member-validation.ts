import { addDays, subDays } from "date-fns";
import proxyquire from "proxyquire";
import sinon from "sinon";

import testUsers from "./users.json";
import utils from "./utils";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent";
import { Domaine, EmailStatusCode } from "@/models/member";
import { AuthorizationError, BusinessError } from "@/utils/error";

describe(`Test creating new user flow : A new member cannot be validated by someone who is not an a team member`, () => {
    let sendEmailStub, getServerSessionStub, sendNewMemberValidationEmail;
    let newUser,
        newIncubatorB,
        newMission,
        newStartup,
        teamA,
        userA,
        userB,
        newStartupMissionConnexion;
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
                primary_email_status: EmailStatusCode.MEMBER_VALIDATION_WAITING,
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
                incubator_id: newIncubatorB.uuid,
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
            .where("uuid", "=", newIncubatorB.uuid)
            .execute();
        await db.deleteFrom("teams").where("uuid", "=", teamA.uuid).execute();
        await db.deleteFrom("users").where("uuid", "=", newUser.uuid).execute();
        await db
            .deleteFrom("missions")
            .where("uuid", "=", newMission.uuid)
            .execute();
    });
    it("should send forbidden error if an unlogged user try to validate link", async function () {
        const validateNewMember = proxyquire(
            "@/app/api/member/actions/validateNewMember",
            {
                "next-auth/next": { getServerSession: getServerSessionStub },
                "@/server/config/email.config": { sendEmail: sendEmailStub },
            }
        ).validateNewMember;
        try {
            await validateNewMember({ memberUuid: newUser.id });
        } catch (error) {
            error.should.be.instanceof(AuthorizationError);
        }
        const updatedUser = await db
            .selectFrom("users")
            .where("uuid", "=", newUser.uuid)
            .selectAll()
            .executeTakeFirstOrThrow();
        updatedUser?.primary_email_status?.should.equals(
            EmailStatusCode.MEMBER_VALIDATION_WAITING
        );
    });
    it("should send forbidden error if an unthorized member try to validate link", async function () {
        getServerSessionStub = sinon.stub();
        const mockSession = {
            user: { id: userB.username, isAdmin: false, uuid: userB.uuid },
        };
        getServerSessionStub.resolves(mockSession);
        const validateNewMember = proxyquire(
            "@/app/api/member/actions/validateNewMember",
            {
                "next-auth/next": { getServerSession: getServerSessionStub },
                "@/server/config/email.config": { sendEmail: sendEmailStub },
            }
        ).validateNewMember;
        try {
            await validateNewMember({ memberUuid: newUser.uuid });
        } catch (error) {
            error.should.be.instanceof(BusinessError);
            (error as BusinessError).code.should.be.equals(
                "sessionUserNotAdminOrNotInRequiredIncubatorTeam"
            );
        }
        const updatedUser = await db
            .selectFrom("users")
            .where("uuid", "=", newUser.uuid)
            .selectAll()
            .executeTakeFirstOrThrow();
        updatedUser?.primary_email_status?.should.equals(
            EmailStatusCode.MEMBER_VALIDATION_WAITING
        );
    });
    it("should send authorized member of incubator teams to validation user", async function () {
        const mockSession = {
            user: { id: userA.username, isAdmin: false, uuid: userA.uuid },
        };
        getServerSessionStub.resolves(mockSession);
        const validateNewMember = proxyquire(
            "@/app/api/member/actions/validateNewMember",
            {
                "next-auth/next": { getServerSession: getServerSessionStub },
                "@/server/config/email.config": { sendEmail: sendEmailStub },
            }
        ).validateNewMember;

        await validateNewMember({ memberUuid: newUser.uuid });

        const updatedUser = await db
            .selectFrom("users")
            .where("uuid", "=", newUser.uuid)
            .selectAll()
            .executeTakeFirstOrThrow();
        updatedUser?.primary_email_status?.should.equals(
            EmailStatusCode.EMAIL_VERIFICATION_WAITING
        );
        // try to do the action a second time
        try {
            await validateNewMember({ memberUuid: newUser.uuid });
        } catch (error) {
            error.should.be.instanceof(BusinessError);
            (error as BusinessError).code.should.be.equals(
                "userAlreadyValided"
            );
        }
        await db
            .deleteFrom("events")
            .where("action_on_username", "=", newUser.username)
            .where("action_code", "=", EventCode.MEMBER_VALIDATED)
            .execute();
        await db
            .updateTable("users")
            .set({
                primary_email_status: EmailStatusCode.EMAIL_ACTIVE,
            })
            .where("uuid", "=", newUser.uuid)
            .execute();
        try {
            await validateNewMember({ memberUuid: newUser.uuid });
        } catch (error) {
            error.should.be.instanceof(BusinessError);
            (error as BusinessError).code.should.be.equals(
                "userIsNotWaitingValidation"
            );
        }
    });
});
