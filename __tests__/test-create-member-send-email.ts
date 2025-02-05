import { addDays, subDays } from "date-fns";
import PgBoss from "pg-boss";
import proxyquire from "proxyquire";
import sinon from "sinon";

import testUsers from "./users.json";
import utils from "./utils";
import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { SendNewMemberValidationEmailSchemaType } from "@/models/jobs/member";
import { memberPublicInfoToModel } from "@/models/mapper";
import { Domaine } from "@/models/member";
import { EMAIL_TYPES } from "@/server/modules/email";

describe("Test creating new user flow : sending email", () => {
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
        newIncubatorA = await db
            .insertInto("incubators")
            .values({
                title: "un super incubator",
            })
            .returningAll()
            .executeTakeFirstOrThrow();
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
                incubator_id: newIncubatorA.uuid,
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
        teamB = await db
            .insertInto("teams")
            .values({
                name: "Gip team",
                incubator_id: newIncubatorB.uuid,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
        await db
            .insertInto("users_teams")
            .values({
                user_id: userB.uuid,
                team_id: teamB.uuid,
            })
            .execute();
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

    it("should send email to all members of incubator's teams", async () => {
        await sendNewMemberValidationEmail({
            userId: newUser.uuid,
        } as unknown as PgBoss.Job<SendNewMemberValidationEmailSchemaType>);
        const memberDbData = await getUserBasicInfo({ uuid: newUser.uuid });
        [
            sendEmailStub.firstCall.args[0],
            sendEmailStub.secondCall.args[0],
        ].should.have.deep.members([
            {
                toEmail: [userB.primary_email],
                type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
                variables: {
                    newMember: memberPublicInfoToModel(memberDbData),
                    incubatorName: newIncubatorB.title,
                },
            },
            {
                toEmail: [userA.primary_email],
                type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
                variables: {
                    newMember: memberPublicInfoToModel(memberDbData),
                    incubatorName: newIncubatorA.title,
                },
            },
        ]);
    });
});
