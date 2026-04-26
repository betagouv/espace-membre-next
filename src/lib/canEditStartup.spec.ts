import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("canEditStartup", () => {
  let canEditStartup: typeof import("./canEditStartup").canEditStartup;
  let getStartupStub: sinon.SinonStub;
  let getIncubatorTeamMembersStub: sinon.SinonStub;
  let isStartupAgentStub: sinon.SinonStub;

  const mockSession = {
    user: {
      uuid: "session-user-uuid",
      isAdmin: false,
    },
  };

  const mockStartup = {
    uuid: "startup-uuid",
    incubator_id: "incubator-uuid",
  };

  beforeEach(() => {
    sinon.restore();

    getStartupStub = sinon.stub();
    getIncubatorTeamMembersStub = sinon.stub();
    isStartupAgentStub = sinon.stub();

    const somemodule = proxyquire("./canEditStartup", {
      "./kysely/queries": {
        getStartup: getStartupStub,
        isStartupAgent: isStartupAgentStub,
      },
      "./kysely/queries/teams": {
        getIncubatorTeamMembers: getIncubatorTeamMembersStub,
      },
    });

    canEditStartup = somemodule.canEditStartup;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return true when session user is admin", async () => {
    const adminSession = { user: { ...mockSession.user, isAdmin: true } };

    const result = await canEditStartup(adminSession, "startup-uuid");

    expect(result).to.be.true;
    expect(getStartupStub.notCalled).to.be.true;
    expect(getIncubatorTeamMembersStub.notCalled).to.be.true;
    expect(isStartupAgentStub.notCalled).to.be.true;
  });

  it("should return false when startupUuid is null", async () => {
    const result = await canEditStartup(mockSession, null);

    expect(result).to.be.false;
    expect(getStartupStub.notCalled).to.be.true;
  });

  it("should return false when startup is not found", async () => {
    getStartupStub.resolves(undefined);

    const result = await canEditStartup(mockSession, "startup-uuid");

    expect(result).to.be.false;
    expect(getIncubatorTeamMembersStub.notCalled).to.be.true;
  });

  it("should return false when startup has no incubator_id", async () => {
    getStartupStub.resolves({ uuid: "startup-uuid", incubator_id: null });

    const result = await canEditStartup(mockSession, "startup-uuid");

    expect(result).to.be.false;
    expect(getIncubatorTeamMembersStub.notCalled).to.be.true;
  });

  it("should return true when user is a member of the incubator team", async () => {
    getStartupStub.resolves(mockStartup);
    getIncubatorTeamMembersStub.resolves([
      { uuid: "session-user-uuid" },
      { uuid: "other-user-uuid" },
    ]);

    const result = await canEditStartup(mockSession, "startup-uuid");

    expect(result).to.be.true;
    expect(getIncubatorTeamMembersStub.calledOnceWith("incubator-uuid")).to.be
      .true;
    expect(isStartupAgentStub.notCalled).to.be.true;
  });

  it("should return true when user is a startup agent", async () => {
    getStartupStub.resolves(mockStartup);
    getIncubatorTeamMembersStub.resolves([{ uuid: "other-user-uuid" }]);
    isStartupAgentStub.resolves(true);

    const result = await canEditStartup(mockSession, "startup-uuid");

    expect(result).to.be.true;
    expect(
      isStartupAgentStub.calledOnceWith("session-user-uuid", "startup-uuid"),
    ).to.be.true;
  });

  it("should return false when user is neither incubator team member nor startup agent", async () => {
    getStartupStub.resolves(mockStartup);
    getIncubatorTeamMembersStub.resolves([{ uuid: "other-user-uuid" }]);
    isStartupAgentStub.resolves(false);

    const result = await canEditStartup(mockSession, "startup-uuid");

    expect(result).to.be.false;
  });

  it("should return false when incubator team is empty and user is not an agent", async () => {
    getStartupStub.resolves(mockStartup);
    getIncubatorTeamMembersStub.resolves([]);
    isStartupAgentStub.resolves(false);

    const result = await canEditStartup(mockSession, "startup-uuid");

    expect(result).to.be.false;
  });
});
