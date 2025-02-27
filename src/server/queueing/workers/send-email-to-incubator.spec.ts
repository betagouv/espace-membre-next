import { addDays, addDays, subDays } from "date-fns";
import { Selectable } from "kysely";
import PgBoss from "pg-boss";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { Users } from "@/@types/db";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserByStartup } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent";
import {
    incubatorToModel,
    memberBaseInfoToModel,
    memberPublicInfoToModel,
    startupToModel,
} from "@/models/mapper";
import { Domaine } from "@/models/member";
import config from "@/server/config";
import { EMAIL_TYPES } from "@/server/modules/email";
import testUsers from "__tests__/users.json";
import utils from "__tests__/utils";

describe("sendEmailToIncubatorTeam()", () => {
    let sendEmailStub, getServerSessionStub, sendEmailToIncubatorTeam;
    let newUser,
        newIncubatorA,
        newIncubatorB,
        newMission,
        newStartup,
        newStartupMissionConnexion,
        teamA,
        teamB;
    let userA: Selectable<Users>, userB: Selectable<Users>;
    beforeEach(async () => {
        getServerSessionStub = sinon.stub();
        await utils.createUsers(testUsers);
        sendEmailStub = sinon.stub().resolves(); // Resolves like a real async function
        // Use proxyquire to replace bossClient module
        sendEmailToIncubatorTeam = proxyquire(
            "@/server/queueing/workers/send-email-to-incubator",
            {
                "@/server/config/email.config": { sendEmail: sendEmailStub },
            }
        ).sendEmailToIncubatorTeam;
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

    it("should send listing startup to incubator teams", async () => {
        await sendEmailToIncubatorTeam({
            data: {},
        } as unknown as PgBoss.Job<void>);
        const startup = await db
            .selectFrom("startups")
            .selectAll()
            .where("name", "=", "seconda-startup-name")
            .executeTakeFirstOrThrow();
        const usersByStartup = await getUserByStartup(startup.uuid);
        sendEmailStub.firstCall.args[0].should.deep.equal({
            toEmail: [userB.primary_email],
            type: EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS,
            variables: {
                incubator: incubatorToModel(newIncubatorB),
                startupWrappers: [
                    {
                        startup: startupToModel(startup),
                        activeMembers: 1,
                        lastModification: startup.updated_at,
                    },
                ],
            },
        });
    });

    it("should send listing startup to incubator teams", async () => {
        await sendEmailToIncubatorTeam({
            data: {},
        } as unknown as PgBoss.Job<void>);
        const startup = await db
            .selectFrom("startups")
            .selectAll()
            .where("name", "=", "seconda-startup-name")
            .executeTakeFirstOrThrow();
        const usersByStartup = await getUserByStartup(startup.uuid);
        sendEmailStub.firstCall.args[0].should.deep.equal({
            toEmail: [userB.primary_email],
            type: EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS,
            variables: {
                incubator: incubatorToModel(newIncubatorB),
                startupWrappers: [
                    {
                        startup: startupToModel(startup),
                        activeMembers: 1,
                        lastModification: startup.updated_at,
                    },
                ],
            },
        });
    });
    describe("adding an event on startup name", async () => {
        beforeEach(async () => {
            await addEvent({
                action_code: EventCode.MEMBER_BASE_INFO_UPDATED,
                action_on_username: newUser.username,
                created_by_username: newUser.username,
                action_metadata: {
                    value: {
                        missions: [
                            {
                                startups: [newStartup.uuid],
                                start: new Date(),
                                end: new Date(),
                            },
                        ],
                        domaine: newUser.domaine,
                        fullname: newUser.fullname,
                        role: newUser.role,
                        secondary_email: newUser.secondary_email,
                    },
                    old_value: {
                        missions: [
                            {
                                startups: [newStartup.uuid],
                                start: new Date(),
                                end: addDays(new Date(), 3),
                            },
                        ],
                        domaine: newUser.domaine,
                        fullname: newUser.fullname,
                        role: newUser.role,
                        secondary_email: newUser.secondary_email,
                    },
                },
            });
        });
        afterEach(async () => {
            await db.deleteFrom("events").execute();
        });
        it("should not send email if startup has an event within last 3 months", async () => {
            await sendEmailToIncubatorTeam({
                data: {},
            } as unknown as PgBoss.Job<void>);
            sendEmailStub.called.should.be.false;
        });
    });
});
