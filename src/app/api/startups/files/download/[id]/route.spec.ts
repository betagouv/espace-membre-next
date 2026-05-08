import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

describe("startups/files/download/[id] route — authorization", () => {
  let getServerSessionStub: sinon.SinonStub;
  let canEditStartupStub: sinon.SinonStub;
  let executeTakeFirstOrThrowStub: sinon.SinonStub;
  let GET: (req: any, ctx: { params: { id: string } }) => Promise<Response>;

  const fileUuid = "file-uuid";
  const startupUuid = "startup-uuid";

  beforeEach(() => {
    sinon.restore();

    getServerSessionStub = sinon.stub();
    canEditStartupStub = sinon.stub();
    executeTakeFirstOrThrowStub = sinon.stub();

    // Minimal kysely query builder stub:
    // db.selectFrom().select().where().where().executeTakeFirstOrThrow()
    const dbStub = {
      selectFrom: () => ({
        select: () => ({
          where: () => ({
            where: () => ({
              executeTakeFirstOrThrow: executeTakeFirstOrThrowStub,
            }),
          }),
        }),
      }),
    };

    GET = proxyquire("./route", {
      "next-auth": { getServerSession: getServerSessionStub },
      "@/lib/canEditStartup": { canEditStartup: canEditStartupStub },
      "@/lib/kysely": { db: dbStub },
    }).GET;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns 403 when there is no session", async () => {
    getServerSessionStub.resolves(null);

    const res = await GET({} as any, { params: { id: fileUuid } });

    expect(res.status).to.equal(403);
    expect(executeTakeFirstOrThrowStub.notCalled).to.be.true;
    expect(canEditStartupStub.notCalled).to.be.true;
  });

  it("returns 403 when the user cannot edit the file's startup", async () => {
    getServerSessionStub.resolves({
      user: { id: "u1", uuid: "session-uuid", isAdmin: false },
    });
    executeTakeFirstOrThrowStub.resolves({
      filename: "f.pdf",
      base64: Buffer.from("data:application/pdf;base64,Zm9v"),
      startup_id: startupUuid,
    });
    canEditStartupStub.resolves(false);

    const res = await GET({} as any, { params: { id: fileUuid } });

    expect(res.status).to.equal(403);
    expect(
      canEditStartupStub.calledOnceWithExactly(
        sinon.match.object,
        startupUuid,
      ),
    ).to.be.true;
  });

  it("returns the file content when canEditStartup returns true", async () => {
    getServerSessionStub.resolves({
      user: { id: "u1", uuid: "session-uuid", isAdmin: false },
    });
    executeTakeFirstOrThrowStub.resolves({
      filename: "f.pdf",
      base64: Buffer.from("data:application/pdf;base64,Zm9v"),
      startup_id: startupUuid,
    });
    canEditStartupStub.resolves(true);

    const res = await GET({} as any, { params: { id: fileUuid } });

    expect(res.status).to.equal(200);
    expect(canEditStartupStub.calledOnce).to.be.true;
    const body = await res.arrayBuffer();
    // "Zm9v" base64-decoded == "foo"
    expect(Buffer.from(body).toString("utf8")).to.equal("foo");
  });
});
