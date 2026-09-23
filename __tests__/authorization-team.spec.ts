import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

describe("team authorization", () => {
  let canCreateTeam: typeof import("../src/lib/authorization/team").canCreateTeam;
  let assertCanEditTeam: typeof import("../src/lib/authorization/team").assertCanEditTeam;
  let isIncubatorTeamMemberStub: sinon.SinonStub;
  let getTeamStub: sinon.SinonStub;
  let requireAuthSubjectStub: sinon.SinonStub;

  const subject = {
    uuid: "session-user-uuid",
    username: "session.user",
    isAdmin: false,
  };

  beforeEach(() => {
    sinon.restore();
    isIncubatorTeamMemberStub = sinon.stub().resolves(false);
    getTeamStub = sinon.stub();
    requireAuthSubjectStub = sinon.stub().resolves(subject);

    const somemodule = proxyquire("../src/lib/authorization/team", {
      "@/lib/kysely/queries/authorization": {
        isIncubatorTeamMember: isIncubatorTeamMemberStub,
      },
      "@/lib/kysely/queries/teams": { getTeam: getTeamStub },
      "./subject": { requireAuthSubject: requireAuthSubjectStub },
    });

    canCreateTeam = somemodule.canCreateTeam;
    assertCanEditTeam = somemodule.assertCanEditTeam;
  });

  afterEach(() => sinon.restore());

  it("lets an admin create a team anywhere", async () => {
    expect(await canCreateTeam({ ...subject, isAdmin: true }, "incub-a")).to.be
      .true;
    expect(isIncubatorTeamMemberStub.notCalled).to.be.true;
  });

  it("lets a member of the incubator create a team there", async () => {
    isIncubatorTeamMemberStub
      .withArgs("session-user-uuid", "incub-a")
      .resolves(true);
    expect(await canCreateTeam(subject, "incub-a")).to.be.true;
  });

  /**
   * Le trou que la garde ferme : un simple membre connecte creait une equipe
   * rattachee a n'importe quel incubateur et devenait editeur de ses fiches
   * produit par ricochet.
   */
  it("refuses a plain member on an incubator they do not belong to", async () => {
    isIncubatorTeamMemberStub.resolves(false);
    expect(await canCreateTeam(subject, "incub-b")).to.be.false;
  });

  /**
   * Le formulaire permet de deplacer une equipe : il faut les droits sur
   * l'incubateur ACTUEL et sur l'incubateur CIBLE, sinon un membre de A
   * rattache l'equipe a B et devient editeur de B.
   */
  it("refuses to move a team to an incubator the user does not belong to", async () => {
    getTeamStub.resolves({ uuid: "team-uuid", incubator_id: "incub-a" });
    isIncubatorTeamMemberStub
      .withArgs("session-user-uuid", "incub-a")
      .resolves(true);
    isIncubatorTeamMemberStub
      .withArgs("session-user-uuid", "incub-b")
      .resolves(false);

    let thrown: unknown;
    try {
      await assertCanEditTeam("team-uuid", "incub-b");
    } catch (error) {
      thrown = error;
    }
    expect(thrown, "le deplacement vers B a ete autorise").to.exist;
  });

  it("allows the move when the user belongs to both incubators", async () => {
    getTeamStub.resolves({ uuid: "team-uuid", incubator_id: "incub-a" });
    isIncubatorTeamMemberStub.resolves(true);

    const result = await assertCanEditTeam("team-uuid", "incub-b");
    expect(result.subject.uuid).to.equal("session-user-uuid");
    // La garde remonte l'equipe deja chargee : l'action n'a plus a la relire.
    expect(result.team.uuid).to.equal("team-uuid");
  });

  it("refuses when the team does not exist", async () => {
    getTeamStub.resolves(undefined);
    let thrown: unknown;
    try {
      await assertCanEditTeam("unknown", "incub-a");
    } catch (error) {
      thrown = error;
    }
    expect(thrown).to.exist;
  });
});
