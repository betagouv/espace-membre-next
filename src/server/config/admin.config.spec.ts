import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("isSessionUserIncubatorTeamAdminForUser", () => {
  let isSessionUserIncubatorTeamAdminForUser: typeof import("./admin.config").isSessionUserIncubatorTeamAdminForUser;
  let getAllIncubatorsStub: sinon.SinonStub;
  let getUserStartupsStub: sinon.SinonStub;
  let getTeamsForUserStub: sinon.SinonStub;

  // Sample data
  const incubatorA = {
    uuid: "incubator-a-uuid",
    title: "Incubator A",
    description: null,
    contact: null,
    short_description: null,
    ghid: null,
    github: null,
    owner_id: null,
    address: null,
    highlighted_startups: null,
    website: null,
    organization_name: null,
  };

  const incubatorB = {
    uuid: "incubator-b-uuid",
    title: "Incubator B",
    description: null,
    contact: null,
    short_description: null,
    ghid: null,
    github: null,
    owner_id: null,
    address: null,
    highlighted_startups: null,
    website: null,
    organization_name: null,
  };

  const incubatorC = {
    uuid: "incubator-c-uuid",
    title: "Incubator C",
    description: null,
    contact: null,
    short_description: null,
    ghid: null,
    github: null,
    owner_id: null,
    address: null,
    highlighted_startups: null,
    website: null,
    organization_name: null,
  };

  beforeEach(() => {
    sinon.restore();

    getAllIncubatorsStub = sinon.stub();
    getUserStartupsStub = sinon.stub();
    getTeamsForUserStub = sinon.stub();

    const module = proxyquire("./admin.config", {
      "@/lib/kysely/queries/incubators": {
        getAllIncubators: getAllIncubatorsStub,
      },
      "@/lib/kysely/queries/users": {
        getUserStartups: getUserStartupsStub,
      },
      "@/lib/kysely/queries/teams": {
        getTeamsForUser: getTeamsForUserStub,
      },
    });

    isSessionUserIncubatorTeamAdminForUser =
      module.isSessionUserIncubatorTeamAdminForUser;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should return true when session user's team incubator matches user's team incubator", async () => {
    getAllIncubatorsStub.resolves([incubatorA, incubatorB]);
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
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
      },
      sessionUserUuid: "session-user-uuid",
    });

    expect(result).to.be.true;
    expect(getTeamsForUserStub.calledOnceWith("session-user-uuid")).to.be.true;
  });

  it("should return true when session user's team incubator matches user's current startup incubator", async () => {
    const pastDate = new Date("2020-01-01");

    getAllIncubatorsStub.resolves([incubatorA, incubatorB]);
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        ghid: null,
        mailing_list: null,
        start: pastDate, // Mission started in the past (current)
        end: null,
        incubator_id: incubatorA.uuid,
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
        uuid: "user-uuid",
        teams: [],
      },
      sessionUserUuid: "session-user-uuid",
    });

    expect(result).to.be.true;
  });

  it("should return true when session user's team incubator matches provided incubator_id", async () => {
    getAllIncubatorsStub.resolves([incubatorA, incubatorB]);
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
        uuid: "user-uuid",
        teams: [],
      },
      sessionUserUuid: "session-user-uuid",
      incubator_id: incubatorA.uuid,
    });

    expect(result).to.be.true;
  });

  it("should return false when there is no incubator intersection", async () => {
    getAllIncubatorsStub.resolves([incubatorA, incubatorB, incubatorC]);
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorC.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
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
      },
      sessionUserUuid: "session-user-uuid",
    });

    expect(result).to.be.false;
  });

  it("should return false when session user has no teams", async () => {
    getAllIncubatorsStub.resolves([incubatorA, incubatorB]);
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
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
      },
      sessionUserUuid: "session-user-uuid",
    });

    expect(result).to.be.false;
  });

  it("should ignore startup missions that have not started yet", async () => {
    const futureDate = new Date("2099-01-01");

    getAllIncubatorsStub.resolves([incubatorA, incubatorB]);
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        ghid: null,
        mailing_list: null,
        start: futureDate, // Mission has not started yet
        end: null,
        incubator_id: incubatorA.uuid,
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
        uuid: "user-uuid",
        teams: [],
      },
      sessionUserUuid: "session-user-uuid",
    });

    expect(result).to.be.false;
  });

  it("should return true when user has no teams but has matching startup incubator", async () => {
    const pastDate = new Date("2020-01-01");

    getAllIncubatorsStub.resolves([incubatorA, incubatorB]);
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        ghid: null,
        mailing_list: null,
        start: pastDate,
        end: null,
        incubator_id: incubatorB.uuid,
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorB.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
        uuid: "user-uuid",
        teams: undefined,
      },
      sessionUserUuid: "session-user-uuid",
    });

    expect(result).to.be.true;
  });

  it("should handle user with multiple incubators from different sources", async () => {
    const pastDate = new Date("2020-01-01");

    getAllIncubatorsStub.resolves([incubatorA, incubatorB, incubatorC]);
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        ghid: null,
        mailing_list: null,
        start: pastDate,
        end: null,
        incubator_id: incubatorA.uuid,
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorC.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
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
      },
      sessionUserUuid: "session-user-uuid",
      incubator_id: incubatorC.uuid, // This matches session user's team
    });

    expect(result).to.be.true;
  });

  it("should return false when user has no teams, no startups, and no incubator_id", async () => {
    getAllIncubatorsStub.resolves([incubatorA, incubatorB]);
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
        uuid: "user-uuid",
        teams: [],
      },
      sessionUserUuid: "session-user-uuid",
    });

    expect(result).to.be.false;
  });

  it("should handle startups without incubator", async () => {
    const pastDate = new Date("2020-01-01");

    getAllIncubatorsStub.resolves([incubatorA]);
    getUserStartupsStub.resolves([
      {
        uuid: "startup-uuid",
        name: "Startup 1",
        ghid: null,
        mailing_list: null,
        start: pastDate,
        end: null,
        incubator_id: null, // No incubator
      },
    ]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
        uuid: "user-uuid",
        teams: [],
      },
      sessionUserUuid: "session-user-uuid",
    });

    expect(result).to.be.false;
  });

  it("should handle teams without incubator", async () => {
    getAllIncubatorsStub.resolves([incubatorA]);
    getUserStartupsStub.resolves([]);
    getTeamsForUserStub.resolves([{ incubator_id: incubatorA.uuid }]);

    const result = await isSessionUserIncubatorTeamAdminForUser({
      user: {
        uuid: "user-uuid",
        teams: [
          {
            uuid: "team-uuid",
            name: "Team 1",
            incubator_id: "non-existent-incubator", // Incubator not found
            ghid: null,
            mission: null,
          },
        ],
      },
      sessionUserUuid: "session-user-uuid",
    });

    // Team has incubator_id but no matching incubator in getAllIncubators
    // The team.incubator will be null, so it won't be included in userIncubators
    expect(result).to.be.false;
  });
});
