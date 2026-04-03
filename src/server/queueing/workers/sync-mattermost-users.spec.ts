import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

describe("syncMattermostUsers()", () => {
  let mockSyncMattermostUserWithMattermostMemberInfosTable: sinon.SinonStub;
  let syncMattermostUsers: () => Promise<void>;

  beforeEach(() => {
    mockSyncMattermostUserWithMattermostMemberInfosTable = sinon.stub().resolves();
    const module = proxyquire("./sync-mattermost-users", {
      "@/server/schedulers/mattermostScheduler/syncMattermostUserWithMattermostMemberInfosTable": {
        syncMattermostUserWithMattermostMemberInfosTable:
          mockSyncMattermostUserWithMattermostMemberInfosTable,
      },
    });
    syncMattermostUsers = module.syncMattermostUsers;
  });

  afterEach(() => sinon.restore());

  it("should call syncMattermostUserWithMattermostMemberInfosTable", async () => {
    await syncMattermostUsers();
    expect(mockSyncMattermostUserWithMattermostMemberInfosTable.calledOnce).to.be.true;
  });
});
