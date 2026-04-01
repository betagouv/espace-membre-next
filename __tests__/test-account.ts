import chai from "chai";
import chaiHttp from "chai-http";
import * as nextAuth from "next-auth/next";
import sinon from "sinon";

import utils from "./utils";
import { createData, deleteData } from "./utils/fakeData";
import { testUsers } from "./utils/users-data";
import {
  updateCommunicationEmail,
} from "@/app/api/member/actions";
import { db } from "@/lib/kysely";
import { CommunicationEmailCode } from "@/models/member";

chai.use(chaiHttp);

describe("Test Account", () => {
  describe("Authenticated user should be able to perform use action", () => {
    // first render of template 'account' can be slow and exceed timeout this test may fail if timeout < 2000
    let getServerSessionStub;
    let user;

    beforeEach(async () => {
      getServerSessionStub = sinon
        .stub(nextAuth, "getServerSession")
        .resolves({});

      await createData(testUsers);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", "membre.actif")
        .executeTakeFirstOrThrow();
      const mockSession = {
        user: {
          id: "membre.actif",
          isAdmin: false,
          uuid: user.uuid,
        },
      };
      getServerSessionStub.resolves(mockSession);
    });
    afterEach(async () => {
      sinon.restore();
      await deleteData(testUsers);
    });

    it("should update communication_email value", async () => {
      const username = "membre.actif";
      await db
        .updateTable("users")
        .where("username", "=", username)
        .set({
          secondary_email: "membre.actif@gmail.com",
        })
        .execute();
      await updateCommunicationEmail(CommunicationEmailCode.PRIMARY);
      let user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", username)
        .executeTakeFirstOrThrow();
      user.communication_email?.should.equal(CommunicationEmailCode.PRIMARY);
      await updateCommunicationEmail(CommunicationEmailCode.SECONDARY);
      user = await db
        .selectFrom("users")
        .selectAll()
        .where("username", "=", username)
        .executeTakeFirstOrThrow();
      user.communication_email?.should.equal(CommunicationEmailCode.SECONDARY);
    });
  });
});
