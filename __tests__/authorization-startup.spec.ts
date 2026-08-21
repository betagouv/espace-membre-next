import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

describe("canEditStartup", () => {
  let canEditStartup: typeof import("../src/lib/authorization/startup").canEditStartup;
  let getStartupStub: sinon.SinonStub;
  let getStartupIncubatorIdsStub: sinon.SinonStub;
  let isIncubatorTeamMemberStub: sinon.SinonStub;
  let isStartupAgentStub: sinon.SinonStub;

  // Le sujet est plat : plus de session, plus de `any` implicite.
  const subject = {
    uuid: "session-user-uuid",
    username: "session.user",
    isAdmin: false,
  };

  const mockStartup = {
    uuid: "startup-uuid",
    incubator_id: "incubator-uuid",
  };

  beforeEach(() => {
    sinon.restore();

    getStartupStub = sinon.stub();
    getStartupIncubatorIdsStub = sinon.stub().resolves([]);
    isIncubatorTeamMemberStub = sinon.stub().resolves(false);
    isStartupAgentStub = sinon.stub().resolves(false);

    const somemodule = proxyquire("../src/lib/authorization/startup", {
      "@/lib/kysely/queries": {
        getStartup: getStartupStub,
        isStartupAgent: isStartupAgentStub,
      },
      "@/lib/kysely/queries/incubators": {
        getStartupIncubatorIds: getStartupIncubatorIdsStub,
      },
      "@/lib/kysely/queries/authorization": {
        isIncubatorTeamMember: isIncubatorTeamMemberStub,
      },
    });

    canEditStartup = somemodule.canEditStartup;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return true when subject is admin", async () => {
    const result = await canEditStartup(
      { ...subject, isAdmin: true },
      "startup-uuid",
    );

    expect(result).to.be.true;
    expect(getStartupStub.notCalled).to.be.true;
    expect(isIncubatorTeamMemberStub.notCalled).to.be.true;
    expect(isStartupAgentStub.notCalled).to.be.true;
  });

  it("should return false when startupUuid is null", async () => {
    const result = await canEditStartup(subject, null);

    expect(result).to.be.false;
    expect(getStartupStub.notCalled).to.be.true;
  });

  it("should return false when startup is not found", async () => {
    getStartupStub.resolves(undefined);

    const result = await canEditStartup(subject, "startup-uuid");

    expect(result).to.be.false;
    expect(isIncubatorTeamMemberStub.notCalled).to.be.true;
  });

  it("should return false when the startup has no linked incubator", async () => {
    getStartupStub.resolves({ uuid: "startup-uuid", incubator_id: null });
    getStartupIncubatorIdsStub.resolves([]);

    const result = await canEditStartup(subject, "startup-uuid");

    expect(result).to.be.false;
    expect(isIncubatorTeamMemberStub.notCalled).to.be.true;
  });

  it("should return true when user is a member of the incubator team", async () => {
    getStartupStub.resolves(mockStartup);
    // Le principal fait toujours partie des liens, la contrainte
    // startups_principal_incubator_linked le garantit en base.
    getStartupIncubatorIdsStub.resolves(["incubator-uuid"]);
    isIncubatorTeamMemberStub
      .withArgs("session-user-uuid", "incubator-uuid")
      .resolves(true);

    const result = await canEditStartup(subject, "startup-uuid");

    expect(result).to.be.true;
    expect(
      isIncubatorTeamMemberStub.calledWith(
        "session-user-uuid",
        "incubator-uuid",
      ),
    ).to.be.true;
    expect(isStartupAgentStub.notCalled).to.be.true;
  });

  it("should return true when user is a member of an additional incubator team (co-incubation)", async () => {
    getStartupStub.resolves(mockStartup);
    getStartupIncubatorIdsStub.resolves([
      "incubator-uuid",
      "secondary-incubator-uuid",
    ]);
    isIncubatorTeamMemberStub
      .withArgs("session-user-uuid", "secondary-incubator-uuid")
      .resolves(true);

    const result = await canEditStartup(subject, "startup-uuid");

    expect(result).to.be.true;
    expect(isStartupAgentStub.notCalled).to.be.true;
  });

  /**
   * Elargissement assume : getIncubatorTeamMembers excluait deux fois les
   * missions a end IS NULL, donc un membre d'equipe a mission ouverte ne pouvait
   * pas editer. isIncubatorTeamMember ne filtre plus sur les dates.
   */
  it("should not filter incubator team members on mission dates", async () => {
    getStartupStub.resolves(mockStartup);
    getStartupIncubatorIdsStub.resolves(["incubator-uuid"]);
    isIncubatorTeamMemberStub.resolves(true);

    expect(await canEditStartup(subject, "startup-uuid")).to.be.true;
    expect(isIncubatorTeamMemberStub.calledOnce).to.be.true;
  });

  it("should return true when user is a startup agent", async () => {
    getStartupStub.resolves(mockStartup);
    getStartupIncubatorIdsStub.resolves(["incubator-uuid"]);
    isIncubatorTeamMemberStub.resolves(false);
    isStartupAgentStub.resolves(true);

    const result = await canEditStartup(subject, "startup-uuid");

    expect(result).to.be.true;
    expect(
      isStartupAgentStub.calledOnceWith("session-user-uuid", "startup-uuid"),
    ).to.be.true;
  });

  it("should return false when user is neither incubator team member nor startup agent", async () => {
    getStartupStub.resolves(mockStartup);
    getStartupIncubatorIdsStub.resolves(["incubator-uuid"]);
    isIncubatorTeamMemberStub.resolves(false);
    isStartupAgentStub.resolves(false);

    const result = await canEditStartup(subject, "startup-uuid");

    expect(result).to.be.false;
  });

  it("should return false when there is no incubator link and user is not an agent", async () => {
    getStartupStub.resolves(mockStartup);
    getStartupIncubatorIdsStub.resolves([]);
    isStartupAgentStub.resolves(false);

    const result = await canEditStartup(subject, "startup-uuid");

    expect(result).to.be.false;
  });
});
