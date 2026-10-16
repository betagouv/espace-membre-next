import { addMonths } from "date-fns";
import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import { db } from "@/lib/kysely";
import { Domaine, EmailStatusCode } from "@/models/member";

const getServerSessionStub = sinon.stub();
const findUsersUsingEmailStub = sinon.stub();
const sendValidationEmailStub = sinon.stub();

const { createMember } = proxyquire("@/lib/actions/createMember", {
  "next-auth": { getServerSession: getServerSessionStub },
  "@/lib/auth/findUsersByLoginEmail": {
    findUsersUsingEmail: findUsersUsingEmailStub,
  },
  "@/lib/email/send-validation-email": {
    sendNewMemberValidationEmail: sendValidationEmailStub,
  },
  "@/lib/events": { addEvent: sinon.stub().resolves() },
  "next/cache": { revalidatePath: () => {} },
});

const INCUBATOR_ID = "5a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

const invite = (email: string, withStartup = true) =>
  createMember({
    member: {
      firstname: "Ada",
      lastname: "Lovelace",
      email,
      domaine: Domaine.DEVELOPPEMENT,
    },
    missions: [
      {
        start: new Date(),
        end: addMonths(new Date(), 3),
        startups: withStartup ? ["2e3f0c1a-6b7d-4e8f-9a0b-1c2d3e4f5a6b"] : [],
      },
    ],
    incubator_id: withStartup ? undefined : INCUBATOR_ID,
  });

describe("createMember", () => {
  beforeEach(() => {
    getServerSessionStub.reset();
    findUsersUsingEmailStub.reset();
    getServerSessionStub.resolves({
      user: { id: "admin", uuid: "admin-uuid", isAdmin: true },
    });
    findUsersUsingEmailStub.resolves([]);
    sendValidationEmailStub.reset();
    sinon.stub(console, "log");
  });

  afterEach(async () => {
    sinon.restore();
    await db
      .deleteFrom("users")
      .where("username", "=", "ada.lovelace")
      .execute();
  });

  it("refuses the platform mailboxes, legacy ext.beta.gouv.fr included", async () => {
    for (const email of [
      "Ada.Lovelace@Beta.Gouv.fr",
      "ada.lovelace@ext.beta.gouv.fr",
    ]) {
      const result = await invite(email);

      expect(result.success, email).to.be.false;
      expect(result.message).to.contain("@ext.beta.gouv.fr");
    }
    expect(findUsersUsingEmailStub.called).to.be.false;
  });

  it("tells not to create the fiche again when the incubator cannot be notified", async () => {
    getServerSessionStub.resolves({
      user: {
        id: "someone",
        uuid: "7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e0f",
        isAdmin: false,
      },
    });
    sendValidationEmailStub.rejects(new Error("brevo 503"));
    sinon.stub(console, "error");

    const result = await invite("ada@example.com", false);

    expect(result.success).to.be.false;
    expect(result.message).to.contain("Ne recrée pas la fiche");
    expect(result.message).to.contain("/community/ada.lovelace/validate");
    const created = await db
      .selectFrom("users")
      .select("primary_email_status")
      .where("username", "=", "ada.lovelace")
      .executeTakeFirst();
    expect(created?.primary_email_status).to.equal(
      EmailStatusCode.MEMBER_VALIDATION_WAITING,
    );
  });
});
