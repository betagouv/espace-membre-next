import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { deleteFile } from "./delete";
import { AuthorizationError, BusinessError } from "@/utils/error";

describe("deleteFile server action — authorization", () => {
  let getServerSessionStub: sinon.SinonStub;
  let canEditStartupStub: sinon.SinonStub;
  let selectExecuteTakeFirstStub: sinon.SinonStub;
  let updateExecuteTakeFirstOrThrowStub: sinon.SinonStub;
  let handler: typeof deleteFile;

  const fileUuid = "file-uuid";
  const startupUuid = "startup-uuid";

  beforeEach(() => {
    sinon.restore();

    getServerSessionStub = sinon.stub();
    canEditStartupStub = sinon.stub();
    selectExecuteTakeFirstStub = sinon.stub();
    updateExecuteTakeFirstOrThrowStub = sinon.stub().resolves({});

    // Minimal kysely query builder stub:
    // db.selectFrom().select().where().where().executeTakeFirst() and
    // db.updateTable().set().where().executeTakeFirstOrThrow()
    const dbStub = {
      selectFrom: () => ({
        select: () => ({
          where: () => ({
            where: () => ({ executeTakeFirst: selectExecuteTakeFirstStub }),
          }),
        }),
      }),
      updateTable: () => ({
        set: () => ({
          where: () => ({
            executeTakeFirstOrThrow: updateExecuteTakeFirstOrThrowStub,
          }),
        }),
      }),
    };

    handler = proxyquire("./delete", {
      "next-auth": { getServerSession: getServerSessionStub },
      "@/lib/canEditStartup": { canEditStartup: canEditStartupStub },
      "@/lib/kysely": { db: dbStub },
    }).deleteFile as typeof deleteFile;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("throws AuthorizationError when there is no session", async () => {
    getServerSessionStub.resolves(null);

    let thrown: unknown;
    try {
      await handler({ uuid: fileUuid });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.be.instanceOf(AuthorizationError);
    expect(selectExecuteTakeFirstStub.notCalled).to.be.true;
    expect(updateExecuteTakeFirstOrThrowStub.notCalled).to.be.true;
  });

  it("throws BusinessError when the file does not exist", async () => {
    getServerSessionStub.resolves({
      user: { id: "u1", uuid: "session-uuid", isAdmin: false },
    });
    selectExecuteTakeFirstStub.resolves(undefined);

    let thrown: unknown;
    try {
      await handler({ uuid: fileUuid });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.be.instanceOf(BusinessError);
    expect(canEditStartupStub.notCalled).to.be.true;
    expect(updateExecuteTakeFirstOrThrowStub.notCalled).to.be.true;
  });

  it("throws AuthorizationError when the user cannot edit the file's startup", async () => {
    getServerSessionStub.resolves({
      user: { id: "u1", uuid: "session-uuid", isAdmin: false },
    });
    selectExecuteTakeFirstStub.resolves({ startup_id: startupUuid });
    canEditStartupStub.resolves(false);

    let thrown: unknown;
    try {
      await handler({ uuid: fileUuid });
    } catch (e) {
      thrown = e;
    }

    expect(thrown).to.be.instanceOf(AuthorizationError);
    expect(
      canEditStartupStub.calledOnceWithExactly(
        sinon.match.object,
        startupUuid,
      ),
    ).to.be.true;
    expect(updateExecuteTakeFirstOrThrowStub.notCalled).to.be.true;
  });

  it("soft-deletes the file when canEditStartup returns true", async () => {
    getServerSessionStub.resolves({
      user: { id: "u1", uuid: "session-uuid", isAdmin: false },
    });
    selectExecuteTakeFirstStub.resolves({ startup_id: startupUuid });
    canEditStartupStub.resolves(true);

    const result = await handler({ uuid: fileUuid });

    expect(canEditStartupStub.calledOnce).to.be.true;
    expect(updateExecuteTakeFirstOrThrowStub.calledOnce).to.be.true;
    expect(result).to.equal(true);
  });
});
