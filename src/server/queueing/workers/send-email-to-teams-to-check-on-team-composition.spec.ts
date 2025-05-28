import { Selectable } from "kysely";
import PgBoss from "pg-boss";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { Users } from "@/@types/db";
import { db } from "@/lib/kysely";
import { getUsersByStartup } from "@/lib/kysely/queries/users";
import {
    memberBaseInfoToModel,
    memberPublicInfoToModel,
    startupToModel,
} from "@/models/mapper";
import config from "@/server/config";
import { EMAIL_TYPES } from "@/server/modules/email";
import { testUsers } from "__tests__/utils/users-data";
import utils from "__tests__/utils/utils";

describe("sendEmailToTeamsToCheckOnTeamComposition()", () => {
    let sendEmailStub,
        getServerSessionStub,
        sendEmailToTeamsToCheckOnTeamComposition;
    let userA: Selectable<Users>, userB: Selectable<Users>;
    beforeEach(async () => {
        getServerSessionStub = sinon.stub();
        await utils.createData(testUsers);
        sendEmailStub = sinon.stub().resolves(); // Resolves like a real async function
        // Use proxyquire to replace bossClient module
        sendEmailToTeamsToCheckOnTeamComposition = proxyquire(
            "@/server/queueing/workers/send-email-to-teams-to-check-on-team-composition",
            {
                "@/server/config/email.config": { sendEmail: sendEmailStub },
            },
        ).sendEmailToTeamsToCheckOnTeamComposition;
    });

    afterEach(async () => {
        await utils.deleteData(testUsers);
    });

    it("should send email listing teams member", async () => {
        await sendEmailToTeamsToCheckOnTeamComposition({
            data: {},
        } as unknown as PgBoss.Job<void>);
        const startup = await db
            .selectFrom("startups")
            .selectAll()
            .where("name", "=", "test-startup")
            .executeTakeFirstOrThrow();
        const usersByStartup = await getUsersByStartup(startup.uuid);
        sendEmailStub.firstCall.args[0].should.deep.equal({
            toEmail: usersByStartup
                .map((u) => u.primary_email)
                .filter((email) => !!email),
            type: EMAIL_TYPES.EMAIL_TEAM_COMPOSITION,
            variables: {
                activeMembers: usersByStartup.map((u) => ({
                    member: memberBaseInfoToModel(u),
                    activeMission: memberBaseInfoToModel(u).missions[0],
                })),
                memberAccountLink: `${config.protocol}://${config.host}/account/base-info`,
                startup: startupToModel(startup),
            },
        });
    });
});
