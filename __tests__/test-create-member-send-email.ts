import { addDays, subDays } from "date-fns";
import PgBoss from "pg-boss";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { testUsers } from "./utils/users-data";
import utils from "./utils";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserBasicInfo, getUserStartups } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent";
import { SendNewMemberValidationEmailSchemaType } from "@/models/jobs/member";
import {
  incubatorToModel,
  memberPublicInfoToModel,
  userStartupToModel,
} from "@/models/mapper";
import { Domaine } from "@/models/member";
import config from "@/server/config";
import { EMAIL_TYPES } from "@/server/modules/email";

describe("Test creating new user flow : sending email", () => {
  let sendEmailStub, getServerSessionStub, sendNewMemberValidationEmail;
  let newUser,
    newIncubatorA,
    newIncubatorB,
    newMission,
    newStartupMissionConnexion,
    newStartup,
    event,
    teamA,
    teamB,
    userA,
    userB;
  beforeEach(async () => {
    getServerSessionStub = sinon.stub();
    await utils.createData(testUsers);
    sendEmailStub = sinon.stub().resolves(); // Resolves like a real async function
    // Use proxyquire to replace bossClient module
    sendNewMemberValidationEmail = proxyquire(
      "@/server/queueing/workers/send-validation-email",
      {
        "@/server/config/email.config": { sendEmail: sendEmailStub },
      },
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
        user_id: newUser.uuid,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    newStartup = await utils.createStartup(
      newIncubatorB.uuid,
      "seconda-startup-name",
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
    event = await addEvent({
      created_by_username: userB.username,
      action_on_username: newUser.username,
      action_code: EventCode.MEMBER_CREATED,
      action_metadata: {
        member: {
          ...newUser,
          domaine: Domaine.ANIMATION,
          email: newUser.secondary_email!,
          firstname: "un nom",
          lastname: "un nom de famille",
        },
        missions: [
          {
            ...newMission,
          },
        ],
        incubator_id: newIncubatorA.uuid,
      },
    });
  });

  afterEach(async () => {
    await utils.deleteData(testUsers);
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
    await db.deleteFrom("events").where("id", "=", event.id).execute();
  });

  it("should send email to all members of incubator's teams", async () => {
    await sendNewMemberValidationEmail({
      data: {
        userId: newUser.uuid,
        incubator_id: newIncubatorA.uuid,
      },
    } as unknown as PgBoss.Job<SendNewMemberValidationEmailSchemaType>);
    const memberDbData = await getUserBasicInfo({ uuid: newUser.uuid });
    const startups = (await getUserStartups(newUser.uuid)).map((s) =>
      userStartupToModel(s),
    );
    [
      sendEmailStub.firstCall.args[0],
      sendEmailStub.secondCall.args[0],
    ].should.have.deep.members([
      {
        toEmail: [userA.primary_email],
        type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
        variables: {
          userInfos: memberPublicInfoToModel(memberDbData),
          incubator: incubatorToModel(newIncubatorA),
          validationLink: `${config.protocol}://${config.host}/community/annie.mation/validate`,
          startups,
        },
      },
      {
        toEmail: [userB.primary_email],
        type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
        variables: {
          userInfos: memberPublicInfoToModel(memberDbData),
          incubator: incubatorToModel(newIncubatorB),
          validationLink: `${config.protocol}://${config.host}/community/annie.mation/validate`,
          startups,
        },
      },
    ]);
  });
});
