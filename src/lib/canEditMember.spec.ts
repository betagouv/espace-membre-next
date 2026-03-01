import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("canEditMember", () => {
  let canEditMember: typeof import("./canEditMember").canEditMember;
  let getUserStartupsStub: sinon.SinonStub;
  let getTeamsForUserStub: sinon.SinonStub;
  let getUserBasicInfoStub: sinon.SinonStub;

  // Sample data
  const incubatorA = {
    uuid: "incubator-a-uuid",
    title: "Incubator A",
  };

  const incubatorB = {
    uuid: "incubator-b-uuid",
    title: "Incubator B",
  };

  const incubatorC = {
    uuid: "incubator-c-uuid",
    title: "Incubator C",
  };

  const mockSessionUser = {
    id: "session-user-id",
    uuid: "session-user-uuid",
    isAdmin: false,
  };

  beforeEach(() => {
    sinon.restore();

    getUserStartupsStub = sinon.stub();
    getTeamsForUserStub = sinon.stub();
    getUserBasicInfoStub = sinon.stub();

    const module = proxyquire("./canEditMember", {
      "@/lib/kysely/queries/users": {
        getUserStartups: getUserStartupsStub,
        getUserBasicInfo: getUserBasicInfoStub,
      },
      "@/lib/kysely/queries/teams": {
        getTeamsForUser: getTeamsForUserStub,
      },
    });

    canEditMember = module.canEditMember;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return true when session user is admin", async () => {
    const adminSessionUser = { ...mockSessionUser, isAdmin: true };

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: adminSessionUser as any,
    });

    expect(result).to.be.true;
    // Should not call any DB functions when admin
    expect(getUserBasicInfoStub.notCalled).to.be.true;
    expect(getUserStartupsStub.notCalled).to.be.true;
    expect(getTeamsForUserStub.notCalled).to.be.true;
  });

  it("should return true when session user's team incubator matches user's team incubator", async () => {
    getUserBasicInfoStub.onFirstCall().resolves({
      uuid: "user-uuid",
      teams: [
        {
          uuid: "team-uuid",
          name: "Team 1",
          incubator_id: incubatorA.uuid,
          ghid: null,
          mission: null,
        },
      ],
    });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.true;
    expect(getTeamsForUserStub.calledOnceWith("session-user-uuid")).to.be.true;
  });

  it("should return true when session user's team incubator matches user's current startup incubator", async () => {
    const pastDate = new Date("2020-01-01");

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        start: pastDate,
        end: null,
        incubator_id: incubatorA.uuid,
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.true;
  });

  it("should return true when session user's team incubator matches provided incubator_id", async () => {
    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
      incubator_id: incubatorA.uuid,
    });

    expect(result).to.be.true;
  });

  it("should return false when there is no incubator intersection", async () => {
    getUserBasicInfoStub.onFirstCall().resolves({
      uuid: "user-uuid",
      teams: [
        {
          uuid: "team-uuid",
          name: "Team 1",
          incubator_id: incubatorA.uuid,
          ghid: null,
          mission: null,
        },
      ],
    });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorC.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  it("should return false when session user has no teams", async () => {
    getUserBasicInfoStub.onFirstCall().resolves({
      uuid: "user-uuid",
      teams: [
        {
          uuid: "team-uuid",
          name: "Team 1",
          incubator_id: incubatorA.uuid,
          ghid: null,
          mission: null,
        },
      ],
    });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  it("should ignore startup missions that have not started yet", async () => {
    const futureDate = new Date("2099-01-01");

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        start: futureDate,
        end: null,
        incubator_id: incubatorA.uuid,
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  it("should return true when user has no teams but has matching startup incubator", async () => {
    const pastDate = new Date("2020-01-01");

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: undefined });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        start: pastDate,
        end: null,
        incubator_id: incubatorB.uuid,
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorB.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.true;
  });

  it("should handle user with multiple incubators from different sources", async () => {
    const pastDate = new Date("2020-01-01");

    getUserBasicInfoStub.onFirstCall().resolves({
      uuid: "user-uuid",
      teams: [
        {
          uuid: "team-uuid",
          name: "Team 1",
          incubator_id: incubatorB.uuid,
          ghid: null,
          mission: null,
        },
      ],
    });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        start: pastDate,
        end: null,
        incubator_id: incubatorA.uuid,
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorC.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
      incubator_id: incubatorC.uuid,
    });

    expect(result).to.be.true;
  });

  it("should return false when user has no teams, no startups, and no incubator_id", async () => {
    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  it("should handle startups without incubator", async () => {
    const pastDate = new Date("2020-01-01");

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        start: pastDate,
        end: null,
        incubator_id: null,
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  it("should handle teams without incubator", async () => {
    getUserBasicInfoStub.onFirstCall().resolves({
      uuid: "user-uuid",
      teams: [
        {
          uuid: "team-uuid",
          name: "Team 1",
          incubator_id: "non-existent-incubator",
          ghid: null,
          mission: null,
        },
      ],
    });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  // Tests for shared startup + contractuel/fonctionnaire logic

  it("should return true when session user shares a startup with target user and session user is contractuel", async () => {
    const pastDate = new Date("2020-01-01");
    const sharedStartupUuid = "shared-startup-uuid";

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "contractuel" });

    getUserStartupsStub
      .onFirstCall()
      .resolves([
        {
          uuid: sharedStartupUuid,
          name: "Shared Startup",
          start: pastDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ])
      .onSecondCall()
      .resolves([
        {
          uuid: sharedStartupUuid,
          name: "Shared Startup",
          start: pastDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ]);

    getTeamsForUserStub.resolves([{ incubator_id: incubatorB.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.true;
  });

  it("should return true when session user shares a startup with target user and session user is fonctionnaire", async () => {
    const pastDate = new Date("2020-01-01");
    const sharedStartupUuid = "shared-startup-uuid";

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "fonctionnaire" });

    getUserStartupsStub
      .onFirstCall()
      .resolves([
        {
          uuid: sharedStartupUuid,
          name: "Shared Startup",
          start: pastDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ])
      .onSecondCall()
      .resolves([
        {
          uuid: sharedStartupUuid,
          name: "Shared Startup",
          start: pastDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ]);

    getTeamsForUserStub.resolves([{ incubator_id: incubatorB.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.true;
  });

  it("should return false when session user shares a startup but is independant", async () => {
    const pastDate = new Date("2020-01-01");
    const sharedStartupUuid = "shared-startup-uuid";

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "independant" });

    getUserStartupsStub
      .onFirstCall()
      .resolves([
        {
          uuid: sharedStartupUuid,
          name: "Shared Startup",
          start: pastDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ])
      .onSecondCall()
      .resolves([
        {
          uuid: sharedStartupUuid,
          name: "Shared Startup",
          start: pastDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ]);

    getTeamsForUserStub.resolves([{ incubator_id: incubatorB.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  it("should return false when session user is contractuel but does not share any startup", async () => {
    const pastDate = new Date("2020-01-01");

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "contractuel" });

    getUserStartupsStub
      .onFirstCall()
      .resolves([
        {
          uuid: "startup-1",
          name: "Startup 1",
          start: pastDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ])
      .onSecondCall()
      .resolves([
        {
          uuid: "startup-2",
          name: "Startup 2",
          start: pastDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ]);

    getTeamsForUserStub.resolves([{ incubator_id: incubatorB.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  it("should return false when session user info cannot be found", async () => {
    const pastDate = new Date("2020-01-01");

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves(null);

    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        start: pastDate,
        end: null,
        incubator_id: incubatorA.uuid,
      },
    ]);

    getTeamsForUserStub.resolves([{ incubator_id: incubatorB.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  it("should ignore shared startups that have not started yet for contractuel users", async () => {
    const futureDate = new Date("2099-01-01");
    const sharedStartupUuid = "shared-startup-uuid";

    getUserBasicInfoStub.onFirstCall().resolves({ uuid: "user-uuid", teams: [] });
    getUserBasicInfoStub.onSecondCall().resolves({ legal_status: "contractuel" });

    getUserStartupsStub
      .onFirstCall()
      .resolves([
        {
          uuid: sharedStartupUuid,
          name: "Shared Startup",
          start: futureDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ])
      .onSecondCall()
      .resolves([
        {
          uuid: sharedStartupUuid,
          name: "Shared Startup",
          start: futureDate,
          end: null,
          incubator_id: incubatorA.uuid,
        },
      ]);

    getTeamsForUserStub.resolves([{ incubator_id: incubatorB.uuid }]);

    const result = await canEditMember({
      memberUuid: "user-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });

  it("should return false when member not found", async () => {
    getUserBasicInfoStub.resolves(null);

    const result = await canEditMember({
      memberUuid: "non-existent-uuid",
      sessionUser: mockSessionUser as any,
    });

    expect(result).to.be.false;
  });
});
