import { expect } from "chai";
import sinon from "sinon";
import proxyquire from "proxyquire";

const fakeJob: any = { id: "job-1", name: "sync-matrix-accounts", data: null };

describe("syncMatrixAccounts", () => {
  let syncMatrixAccounts: (job: any) => Promise<void>;
  let isPublicServiceEmailStub: sinon.SinonStub;
  let lookupMatrixIdsByEmailsStub: sinon.SinonStub;
  let selectExecuteStub: sinon.SinonStub;
  let insertExecuteStub: sinon.SinonStub;
  let valuesStub: sinon.SinonStub;

  beforeEach(() => {
    isPublicServiceEmailStub = sinon.stub().resolves(false);
    lookupMatrixIdsByEmailsStub = sinon.stub().resolves(new Map());
    selectExecuteStub = sinon.stub().resolves([]);
    insertExecuteStub = sinon.stub().resolves();

    const queryBuilder: any = {};
    queryBuilder.leftJoin = sinon.stub().returns(queryBuilder);
    queryBuilder.select = sinon.stub().returns(queryBuilder);
    queryBuilder.groupBy = sinon.stub().returns({ execute: selectExecuteStub });

    const onConflictStub = sinon.stub().returns({ execute: insertExecuteStub });
    valuesStub = sinon.stub().returns({ onConflict: onConflictStub });

    const dbStub = {
      selectFrom: sinon.stub().returns(queryBuilder),
      insertInto: sinon.stub().returns({ values: valuesStub }),
    };

    const mod = proxyquire("./sync-matrix-accounts", {
      "@/lib/kysely": { db: dbStub, "@noCallThru": true },
      "@/server/controllers/utils": {
        isPublicServiceEmail: isPublicServiceEmailStub,
        "@noCallThru": true,
      },
      "@/lib/matrix/client": {
        lookupMatrixIdsByEmails: lookupMatrixIdsByEmailsStub,
        "@noCallThru": true,
      },
    });
    syncMatrixAccounts = mod.syncMatrixAccounts;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("does not upsert when no users have candidate emails", async () => {
    selectExecuteStub.resolves([
      {
        uuid: "uuid-1",
        primary_email: "user@gmail.com",
        secondary_email: null,
        dinum_emails: null,
      },
    ]);

    await syncMatrixAccounts(fakeJob);

    expect(valuesStub.called).to.be.false;
  });

  it("includes public service primary email as candidate", async () => {
    selectExecuteStub.resolves([
      {
        uuid: "uuid-1",
        primary_email: "agent@ministry.gouv.fr",
        secondary_email: null,
        dinum_emails: null,
      },
    ]);
    isPublicServiceEmailStub.withArgs("agent@ministry.gouv.fr").resolves(true);
    lookupMatrixIdsByEmailsStub.resolves(
      new Map([["agent@ministry.gouv.fr", "@agent:tchap.gouv.fr"]]),
    );

    await syncMatrixAccounts(fakeJob);

    expect(valuesStub.firstCall.args[0]).to.deep.equal([
      { user_id: "uuid-1", matrix_id: "@agent:tchap.gouv.fr" },
    ]);
  });

  it("includes public service secondary email as candidate when primary is not", async () => {
    selectExecuteStub.resolves([
      {
        uuid: "uuid-1",
        primary_email: "user@contractor.com",
        secondary_email: "agent@education.gouv.fr",
        dinum_emails: null,
      },
    ]);
    isPublicServiceEmailStub.withArgs("user@contractor.com").resolves(false);
    isPublicServiceEmailStub
      .withArgs("agent@education.gouv.fr")
      .resolves(true);
    lookupMatrixIdsByEmailsStub.resolves(
      new Map([["agent@education.gouv.fr", "@agent:education.tchap.gouv.fr"]]),
    );

    await syncMatrixAccounts(fakeJob);

    expect(valuesStub.firstCall.args[0]).to.deep.equal([
      { user_id: "uuid-1", matrix_id: "@agent:education.tchap.gouv.fr" },
    ]);
  });

  it("always includes dinum emails as candidates regardless of public service check", async () => {
    selectExecuteStub.resolves([
      {
        uuid: "uuid-1",
        primary_email: "user@contractor.com",
        secondary_email: null,
        dinum_emails: ["user@beta.gouv.fr"],
      },
    ]);
    lookupMatrixIdsByEmailsStub.resolves(
      new Map([["user@beta.gouv.fr", "@user:beta.tchap.gouv.fr"]]),
    );

    await syncMatrixAccounts(fakeJob);

    expect(valuesStub.firstCall.args[0]).to.deep.equal([
      { user_id: "uuid-1", matrix_id: "@user:beta.tchap.gouv.fr" },
    ]);
  });

  it("picks the first matching email in order: primary, secondary, dinum", async () => {
    selectExecuteStub.resolves([
      {
        uuid: "uuid-1",
        primary_email: "agent@gouv.fr",
        secondary_email: "also@gouv.fr",
        dinum_emails: ["dinum@beta.gouv.fr"],
      },
    ]);
    isPublicServiceEmailStub.resolves(true);
    lookupMatrixIdsByEmailsStub.resolves(
      new Map([
        ["agent@gouv.fr", "@agent:primary.tchap.gouv.fr"],
        ["also@gouv.fr", "@also:secondary.tchap.gouv.fr"],
        ["dinum@beta.gouv.fr", "@dinum:beta.tchap.gouv.fr"],
      ]),
    );

    await syncMatrixAccounts(fakeJob);

    const upserted = valuesStub.firstCall.args[0];
    expect(upserted).to.have.length(1);
    expect(upserted[0].matrix_id).to.equal("@agent:primary.tchap.gouv.fr");
  });

  it("does not upsert when identity server returns no match for any candidate", async () => {
    selectExecuteStub.resolves([
      {
        uuid: "uuid-1",
        primary_email: "agent@gouv.fr",
        secondary_email: null,
        dinum_emails: null,
      },
    ]);
    isPublicServiceEmailStub.withArgs("agent@gouv.fr").resolves(true);
    // lookupMatrixIdsByEmailsStub already returns empty Map by default

    await syncMatrixAccounts(fakeJob);

    expect(valuesStub.called).to.be.false;
  });

  it("deduplicates emails sent to lookup and upserts each matched user once", async () => {
    selectExecuteStub.resolves([
      {
        uuid: "uuid-1",
        primary_email: "shared@gouv.fr",
        secondary_email: null,
        dinum_emails: ["shared@gouv.fr"],
      },
      {
        uuid: "uuid-2",
        primary_email: "other@gouv.fr",
        secondary_email: null,
        dinum_emails: null,
      },
    ]);
    isPublicServiceEmailStub.withArgs("shared@gouv.fr").resolves(true);
    isPublicServiceEmailStub.withArgs("other@gouv.fr").resolves(true);
    lookupMatrixIdsByEmailsStub.resolves(
      new Map([
        ["shared@gouv.fr", "@shared:tchap.gouv.fr"],
        ["other@gouv.fr", "@other:tchap.gouv.fr"],
      ]),
    );

    await syncMatrixAccounts(fakeJob);

    const [uniqueEmails] = lookupMatrixIdsByEmailsStub.firstCall.args;
    expect(uniqueEmails).to.have.length(2);
    expect(uniqueEmails).to.include("shared@gouv.fr");
    expect(uniqueEmails).to.include("other@gouv.fr");

    expect(valuesStub.firstCall.args[0]).to.have.length(2);
  });
});
