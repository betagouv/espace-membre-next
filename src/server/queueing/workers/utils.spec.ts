import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

const mockGetUserBasicInfo = sinon.stub();
const mockMemberPublicInfoToModel = sinon.stub().returns({ username: "john.doe" });
const mockExecute = sinon.stub();

const mockDb = {
  selectFrom: sinon.stub().returns({
    selectAll: sinon.stub().returns({
      where: sinon.stub().returns({ execute: mockExecute }),
    }),
  }),
};

const { getMemberIfValidOrThrowError } = proxyquire("./utils", {
  "@/lib/kysely/queries/users": { getUserBasicInfo: mockGetUserBasicInfo },
  "@/models/mapper": { memberPublicInfoToModel: mockMemberPublicInfoToModel },
  "@/lib/kysely": { db: mockDb },
});

describe("getMemberIfValidOrThrowError()", () => {
  const USER_UUID = "00000000-0000-0000-0000-000000000001";

  beforeEach(() => {
    sinon.resetHistory();
    mockMemberPublicInfoToModel.returns({ username: "john.doe" });
  });

  afterEach(() => sinon.restore());

  it("should throw NoDataError when user is not found", async () => {
    mockGetUserBasicInfo.resolves(null);
    mockExecute.resolves([]);
    try {
      await getMemberIfValidOrThrowError(USER_UUID);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.constructor.name).to.equal("NoDataError");
    }
  });

  it("should throw BusinessError when user has no missions", async () => {
    mockGetUserBasicInfo.resolves({ uuid: USER_UUID, username: "john.doe" });
    mockExecute.resolves([]);
    try {
      await getMemberIfValidOrThrowError(USER_UUID);
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.constructor.name).to.equal("BusinessError");
      expect(e.message).to.include("does not have any missions");
    }
  });

  it("should return mapped member when user exists with missions", async () => {
    mockGetUserBasicInfo.resolves({ uuid: USER_UUID, username: "john.doe" });
    mockExecute.resolves([{ uuid: "mission-1" }]);
    const result = await getMemberIfValidOrThrowError(USER_UUID);
    expect(result).to.deep.equal({ username: "john.doe" });
    expect(mockMemberPublicInfoToModel.calledOnce).to.be.true;
  });
});
