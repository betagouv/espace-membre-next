import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { AuthorizationError, NoDataError } from "@/lib/error";

const subject = {
  uuid: "session-user-uuid",
  username: "session.user",
  isAdmin: false,
};

const chain = (result: unknown) => {
  const builder: Record<string, sinon.SinonStub> = {};
  for (const method of ["select", "where", "set", "values", "returning"]) {
    builder[method] = sinon.stub().returns(builder);
  }
  builder.executeTakeFirst = sinon.stub().resolves(result);
  builder.executeTakeFirstOrThrow = sinon.stub().resolves(result);
  return builder;
};

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  return undefined;
};

describe("startup files authorization", () => {
  afterEach(() => sinon.restore());

  describe("deleteFile", () => {
    let deleteFile: typeof import("../src/app/api/startups/files/delete").deleteFile;
    let selected: ReturnType<typeof chain>;
    let updateTable: sinon.SinonStub;
    let canEditStartupInfo: sinon.SinonStub;

    beforeEach(() => {
      selected = chain({ startup_id: "startup-a" });
      updateTable = sinon.stub().returns(chain({}));
      canEditStartupInfo = sinon.stub().resolves(false);
      deleteFile = proxyquire("../src/app/api/startups/files/delete", {
        "@/lib/authorization": {
          requireAuthSubject: sinon.stub().resolves(subject),
          canEditStartupInfo,
        },
        "@/lib/kysely": {
          db: { selectFrom: sinon.stub().returns(selected), updateTable },
        },
      }).deleteFile;
    });

    /**
     * Le trou corrige : tout membre connecte supprimait le document de
     * n'importe quel produit en appelant l'action avec son uuid.
     */
    it("refuses a member who cannot edit the file's product", async () => {
      const error = await rejection(deleteFile({ uuid: "file-uuid" }));
      expect(error).to.be.instanceOf(AuthorizationError);
      expect(canEditStartupInfo.calledOnceWith(subject, "startup-a")).to.be
        .true;
      expect(updateTable.notCalled).to.be.true;
    });

    it("soft-deletes the file for a member who can edit the product", async () => {
      canEditStartupInfo.resolves(true);
      expect(await deleteFile({ uuid: "file-uuid" })).to.be.true;
      expect(updateTable.calledOnceWith("startups_files")).to.be.true;
    });

    it("answers not found for an unknown or already deleted file", async () => {
      selected.executeTakeFirst.resolves(undefined);
      const error = await rejection(deleteFile({ uuid: "file-uuid" }));
      expect(error).to.be.instanceOf(NoDataError);
      expect(updateTable.notCalled).to.be.true;
    });
  });

  describe("uploadStartupFile", () => {
    let uploadStartupFile: typeof import("../src/app/api/startups/files/upload").uploadStartupFile;
    let insertInto: sinon.SinonStub;
    let assertCanEditStartupInfo: sinon.SinonStub;

    const params = {
      uuid: "startup-a",
      content: "data:text/plain;base64,aGVsbG8=",
      filename: "doc.txt",
      size: 5,
      title: "Un document",
      type: "Autre",
      comments: "",
    } as Parameters<typeof uploadStartupFile>[0];

    beforeEach(() => {
      insertInto = sinon.stub().returns(chain({ uuid: "file-uuid" }));
      assertCanEditStartupInfo = sinon.stub().resolves(subject);
      uploadStartupFile = proxyquire("../src/app/api/startups/files/upload", {
        "next/cache": { revalidatePath: sinon.stub() },
        "@/lib/authorization": { assertCanEditStartupInfo },
        "@/lib/kysely": { db: { insertInto } },
      }).uploadStartupFile;
    });

    it("refuses to attach a file to a product the member cannot edit", async () => {
      assertCanEditStartupInfo.rejects(new AuthorizationError());
      const error = await rejection(uploadStartupFile(params));
      expect(error).to.be.instanceOf(AuthorizationError);
      expect(assertCanEditStartupInfo.calledOnceWith("startup-a")).to.be.true;
      expect(insertInto.notCalled).to.be.true;
    });

    it("stores the file with the member as author when allowed", async () => {
      await uploadStartupFile(params);
      const values = insertInto.firstCall.returnValue.values.firstCall.args[0];
      expect(values.startup_id).to.equal("startup-a");
      expect(values.created_by).to.equal("session-user-uuid");
    });
  });
});
