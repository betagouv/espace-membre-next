import { Selectable } from "kysely";
import PgBoss from "pg-boss";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { Users } from "@/@types/db";
import { db } from "@/lib/kysely";
import {
  getUserInfos,
  getUsersByStartup,
  getUserStartups,
} from "@/lib/kysely/queries/users";
import {
  memberBaseInfoToModel,
  memberPublicInfoToModel,
  startupToModel,
  userInfosToModel,
  userStartupToModel,
} from "@/models/mapper";
import config from "@/server/config";
import { EMAIL_TYPES } from "@/server/modules/email";
import utils from "__tests__/utils";
import {
  newMemberInStartupA,
  otherMemberFromStartupA,
  userIncubatorAndTeams,
} from "__tests__/utils/users-data";

describe("sendEmailToTeamWhenNewMember()", () => {
  let sendEmailStub, getServerSessionStub, sendEmailToTeamWhenNewMember;
  let userA: Selectable<Users>, userB: Selectable<Users>;
  beforeEach(async () => {
    getServerSessionStub = sinon.stub();
    await utils.createData(userIncubatorAndTeams);
    sendEmailStub = sinon.stub().resolves(); // Resolves like a real async function
    // Use proxyquire to replace bossClient module
    sendEmailToTeamWhenNewMember = proxyquire(
      "@/server/queueing/workers/send-email-to-team-when-new-member",
      {
        "@/server/config/email.config": { sendEmail: sendEmailStub },
      },
    ).sendEmailToTeamWhenNewMember;
  });

  afterEach(async () => {
    await utils.deleteData(userIncubatorAndTeams);
  });

  it("should send email listing teams member", async () => {
    const newMember = await getUserInfos({
      username: newMemberInStartupA.username,
    });
    if (!newMember) {
      throw new Error("test: error in test setup, newMember should exists");
    }
    await sendEmailToTeamWhenNewMember({
      data: { userId: newMember.uuid },
    } as unknown as PgBoss.Job<void>);
    const startups = await getUserStartups(newMember.uuid);
    const usersByStartup = (await getUsersByStartup(startups[0].uuid)).filter(
      (user) => user.uuid !== newMember.uuid,
    );
    sendEmailStub.firstCall.args[0].should.deep.equal({
      toEmail: usersByStartup.map((s) => s.primary_email),
      type: EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL,
      variables: {
        userInfos: memberPublicInfoToModel(newMember),
        startup: userStartupToModel(startups[0]),
      },
    });
  });
});
