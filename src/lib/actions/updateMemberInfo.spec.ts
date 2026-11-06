import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { AuthorizationError } from "@/lib/error";

describe("updateMemberInfo", () => {
  let updateMemberInfo: typeof import("./updateMemberInfo").updateMemberInfo;
  let getUserInfosStub: sinon.SinonStub;
  let updateMemberStub: sinon.SinonStub;
  let assertCanEditMemberFullInfoStub: sinon.SinonStub;

  const memberData = { fullname: "Target Member", missions: [] };

  const subject = {
    uuid: "session-user-uuid",
    username: "session.user",
    isAdmin: false,
  };

  beforeEach(() => {
    getUserInfosStub = sinon
      .stub()
      .resolves({ uuid: "target-uuid", username: "target.member" });
    updateMemberStub = sinon.stub().resolves(true);
    assertCanEditMemberFullInfoStub = sinon.stub().resolves(subject);

    updateMemberInfo = proxyquire
      .noCallThru()
      .load("./updateMemberInfo", {
        "@/app/api/member/updateMember": { updateMember: updateMemberStub },
        "@/lib/kysely/queries/users": { getUserInfos: getUserInfosStub },
        "@/lib/authorization/member": {
          assertCanEditMemberFullInfo: assertCanEditMemberFullInfoStub,
        },
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

  it("should update the member when the session user can edit its whole infos", async () => {
    const result = await updateMemberInfo({
      username: "target.member",
      memberData,
    });

    expect(result.success).to.be.true;
    expect(assertCanEditMemberFullInfoStub.calledOnceWith("target-uuid")).to.be
      .true;
    expect(
      updateMemberStub.calledOnceWith(
        memberData,
        "target-uuid",
        undefined,
        subject.username,
      ),
    ).to.be.true;
  });

  it("should refuse when the session user cannot edit the whole infos", async () => {
    assertCanEditMemberFullInfoStub.rejects(new AuthorizationError());

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
    expect(assertCanEditMemberFullInfoStub.notCalled).to.be.true;
    expect(updateMemberStub.notCalled).to.be.true;
  });
});
