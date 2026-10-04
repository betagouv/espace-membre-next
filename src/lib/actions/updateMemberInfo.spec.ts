import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

describe("updateMemberInfo", () => {
  let updateMemberInfo: typeof import("./updateMemberInfo").updateMemberInfo;
  let getServerSessionStub: sinon.SinonStub;
  let getUserInfosStub: sinon.SinonStub;
  let updateMemberStub: sinon.SinonStub;
  let canEditMemberFullInfoStub: sinon.SinonStub;

  const memberData = { fullname: "Target Member", missions: [] };

  const sessionUser = {
    id: "session.user",
    uuid: "session-user-uuid",
    isAdmin: false,
  };

  beforeEach(() => {
    getServerSessionStub = sinon.stub().resolves({ user: sessionUser });
    getUserInfosStub = sinon
      .stub()
      .resolves({ uuid: "target-uuid", username: "target.member" });
    updateMemberStub = sinon.stub().resolves(true);
    canEditMemberFullInfoStub = sinon.stub().resolves(false);

    updateMemberInfo = proxyquire
      .noCallThru()
      .load("./updateMemberInfo", {
        "next-auth": { getServerSession: getServerSessionStub },
        "@/app/api/member/updateMember": { updateMember: updateMemberStub },
        "@/lib/kysely/queries/users": { getUserInfos: getUserInfosStub },
        "@/lib/canEditMember": {
          canEditMemberFullInfo: canEditMemberFullInfoStub,
        },
        "@/lib/authoptions": { authOptions: {} },
        "@/models/actions/member": {
          memberInfoUpdateSchema: {
            shape: { member: { parse: (data: unknown) => data } },
          },
        },
      }).updateMemberInfo;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should refuse when there is no session", async () => {
    getServerSessionStub.resolves(null);

    const result = await updateMemberInfo({
      username: "target.member",
      memberData,
    });

    expect(result.success).to.be.false;
    expect(updateMemberStub.notCalled).to.be.true;
  });

  it("should let a member update its own infos", async () => {
    const result = await updateMemberInfo({
      username: sessionUser.id,
      memberData,
    });

    expect(result.success).to.be.true;
    expect(canEditMemberFullInfoStub.notCalled).to.be.true;
    expect(
      updateMemberStub.calledOnceWith(
        memberData,
        "target-uuid",
        undefined,
        sessionUser.id,
      ),
    ).to.be.true;
  });

  it("should let admins and incubator team members update the whole infos of another member", async () => {
    canEditMemberFullInfoStub.resolves(true);

    const result = await updateMemberInfo({
      username: "target.member",
      memberData,
    });

    expect(result.success).to.be.true;
    expect(
      canEditMemberFullInfoStub.calledOnceWith({
        memberUuid: "target-uuid",
        sessionUser,
      }),
    ).to.be.true;
    expect(
      updateMemberStub.calledOnceWith(
        memberData,
        "target-uuid",
        undefined,
        sessionUser.id,
      ),
    ).to.be.true;
  });

  it("should refuse when session user cannot edit the whole infos of the member", async () => {
    const result = await updateMemberInfo({
      username: "target.member",
      memberData,
    });

    expect(result.success).to.be.false;
    expect(updateMemberStub.notCalled).to.be.true;
  });

  it("should fail when the member does not exist", async () => {
    getUserInfosStub.resolves(undefined);

    const result = await updateMemberInfo({
      username: "unknown.member",
      memberData,
    });

    expect(result.success).to.be.false;
    expect(canEditMemberFullInfoStub.notCalled).to.be.true;
    expect(updateMemberStub.notCalled).to.be.true;
  });
});
