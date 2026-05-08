import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { uploadStartupFile } from "./upload";
import { AuthorizationError } from "@/utils/error";

describe("uploadStartupFile server action — authorization", () => {
  let getServerSessionStub: sinon.SinonStub;
  let canEditStartupStub: sinon.SinonStub;
  let executeTakeFirstOrThrowStub: sinon.SinonStub;
  let revalidatePathStub: sinon.SinonStub;
  let handler: typeof uploadStartupFile;

  const baseParams = {
    title: "title",
    type: "convention" as any,
    uuid: "startup-uuid",
    content: "data:application/pdf;base64,Zm9v",
    comments: "",
    filename: "file.pdf",
    size: 100,
    data: {},
  };

  beforeEach(() => {
    sinon.restore();

    getServerSessionStub = sinon.stub();
    canEditStartupStub = sinon.stub();
    revalidatePathStub = sinon.stub();
    executeTakeFirstOrThrowStub = sinon.stub().resolves({ uuid: "file-uuid" });

    // Minimal kysely query builder stub: db.insertInto().values().returning().executeTakeFirstOrThrow()
    const dbStub = {
      insertInto: () => ({
        values: () => ({
          returning: () => ({
            executeTakeFirstOrThrow: executeTakeFirstOrThrowStub,
          }),
        }),
      }),
    };

    handler = proxyquire("./upload", {
      "next-auth": { getServerSession: getServerSessionStub },
      "next/cache": { revalidatePath: revalidatePathStub },
      "@/lib/canEditStartup": { canEditStartup: canEditStartupStub },
      "@/lib/kysely": { db: dbStub },
    }).uploadStartupFile as typeof uploadStartupFile;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("throws AuthorizationError when there is no session", async () => {
    getServerSessionStub.resolves(null);

    let thrown: unknown;
    try {
      await handler(baseParams);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.be.instanceOf(AuthorizationError);
    expect(canEditStartupStub.notCalled).to.be.true;
    expect(executeTakeFirstOrThrowStub.notCalled).to.be.true;
  });

  it("throws AuthorizationError when the user cannot edit the target startup", async () => {
    getServerSessionStub.resolves({
      user: { id: "u1", uuid: "session-uuid", isAdmin: false },
    });
    canEditStartupStub.resolves(false);

    let thrown: unknown;
    try {
      await handler(baseParams);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.be.instanceOf(AuthorizationError);
    expect(
      canEditStartupStub.calledOnceWithExactly(
        sinon.match.object,
        baseParams.uuid,
      ),
    ).to.be.true;
    expect(executeTakeFirstOrThrowStub.notCalled).to.be.true;
  });

  it("inserts the file when canEditStartup returns true", async () => {
    getServerSessionStub.resolves({
      user: { id: "u1", uuid: "session-uuid", isAdmin: false },
    });
    canEditStartupStub.resolves(true);

    const result = await handler(baseParams);

    expect(canEditStartupStub.calledOnce).to.be.true;
    expect(executeTakeFirstOrThrowStub.calledOnce).to.be.true;
    expect(revalidatePathStub.calledOnceWithExactly("/startups")).to.be.true;
    expect(result).to.deep.equal({ uuid: "file-uuid" });
  });
});
