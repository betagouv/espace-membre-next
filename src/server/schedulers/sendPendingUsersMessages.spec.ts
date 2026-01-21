import { expect } from "chai";
import sinon from "sinon";
import { Kysely, sql } from "kysely";

import { sendPendingUsersMessages } from "./sendPendingUsersMessages";

// Create stubs for the query builder chain
let mockExecute: sinon.SinonStub;
let mockExecuteTakeFirst: sinon.SinonStub;
let mockOrderBy: sinon.SinonStub;
let mockSelect: sinon.SinonStub;
let mockWhere: sinon.SinonStub;
let mockSelectAll: sinon.SinonStub;
let mockSelectFrom: sinon.SinonStub;

// Mock the database instance
let mockDb: Kysely<any>;

describe("getUsersCreatedLast30Days", () => {
  beforeEach(function () {
    // Create fresh stubs for each test
    mockExecute = sinon.stub();
    mockExecuteTakeFirst = sinon.stub();
    mockOrderBy = sinon.stub();
    mockSelect = sinon.stub();
    mockWhere = sinon.stub();
    mockSelectAll = sinon.stub();
    mockSelectFrom = sinon.stub();

    // Setup the query builder chain
    mockSelectFrom.returns({
      selectAll: mockSelectAll,
      select: mockSelect,
    });

    mockSelectAll.returns({
      where: mockWhere,
    });

    mockSelect.returns({
      where: mockWhere,
    });

    mockWhere.returns({
      where: mockWhere,
      orderBy: mockOrderBy,
      execute: mockExecute,
      executeTakeFirst: mockExecuteTakeFirst,
    });

    mockOrderBy.returns({
      execute: mockExecute,
    });

    // Create mock database
    mockDb = {
      selectFrom: mockSelectFrom,
    } as unknown as Kysely<any>;

    //userService = "plop";
  });

  afterEach(function () {
    sinon.restore();
  });

  it("should build correct query for users created in last 30 days", async () => {
    const mockUsers = [
      { id: 1, email: "user1@test.com", created_at: new Date() },
      { id: 2, email: "user2@test.com", created_at: new Date() },
    ];

    await sendPendingUsersMessages();

    mockExecute.resolves(mockUsers);
    console.log("mockSelectFromx", mockSelectFrom);
    const result = "plop"; //await userService.getUsersCreatedLast30Days();
    console.log("io");
    expect(mockSelectFrom.calledWith("users")).to.be.true;
    expect(mockSelectAll.called).to.be.true;
    expect(mockWhere.calledWith("created_at", ">=", sinon.match.object)).to.be
      .true;
    expect(mockExecute.called).to.be.true;
    expect(result).to.deep.equal(mockUsers);
  });
});
