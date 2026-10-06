import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const mockGetUserBasicInfo = sinon.stub();
const mockSendEmail = sinon.stub();
const mockAddEvent = sinon.stub();

const { sendNewMemberVerificationEmail } = proxyquire(
  "./send-verification-email",
  {
    "@/lib/kysely/queries/users": { getUserBasicInfo: mockGetUserBasicInfo },
    "@/server/config/email.config": { sendEmail: mockSendEmail },
    "@/lib/events": { addEvent: mockAddEvent },
    "@/lib/url": { getBaseUrl: () => "https://espace-membre.test" },
  },
);

const USER_UUID = "3f0c2b8e-6a1d-4c7e-8b5f-1d2e3f4a5b6c";

describe("sendNewMemberVerificationEmail", () => {
  beforeEach(() => {
    [mockGetUserBasicInfo, mockSendEmail, mockAddEvent].forEach((s) =>
      s.reset(),
    );
    mockSendEmail.resolves();
    mockAddEvent.resolves();
  });

  it("invites to log in with ProConnect using the primary email, sent to that primary email", async () => {
    mockGetUserBasicInfo.resolves({
      username: "ada.lovelace",
      fullname: "Ada Lovelace",
      primary_email: "ada.lovelace.ext@beta.gouv.fr",
      secondary_email: "ada@example.com",
    });

    await sendNewMemberVerificationEmail({ userId: USER_UUID });

    expect(mockSendEmail.calledOnce).to.be.true;
    const email = mockSendEmail.firstCall.args[0];
    expect(email.type).to.equal("EMAIL_VERIFICATION_WAITING");
    // found in the new mailbox, never sent to the personal email
    expect(email.toEmail).to.deep.equal(["ada.lovelace.ext@beta.gouv.fr"]);
    expect(email.variables).to.deep.equal({
      loginEmail: "ada.lovelace.ext@beta.gouv.fr",
      loginUrl: "https://espace-membre.test/login",
      fullname: "Ada Lovelace",
    });
    // no login token in the invitation
    expect(JSON.stringify(email)).to.not.include("token");
    expect(
      mockAddEvent.calledOnceWith(
        sinon.match({
          action_code: "EMAIL_VERIFICATION_WAITING_SENT",
          action_on_username: "ada.lovelace",
        }),
      ),
    ).to.be.true;
  });

  it("is sent to the primary email when there is no contact email", async () => {
    mockGetUserBasicInfo.resolves({
      username: "ada.lovelace",
      fullname: "Ada Lovelace",
      primary_email: "ada@interieur.gouv.fr",
      secondary_email: null,
    });

    await sendNewMemberVerificationEmail({ userId: USER_UUID });

    expect(mockSendEmail.firstCall.args[0].toEmail).to.deep.equal([
      "ada@interieur.gouv.fr",
    ]);
  });

  it("throws when the member has no primary email yet", async () => {
    mockGetUserBasicInfo.resolves({
      username: "ada.lovelace",
      fullname: "Ada Lovelace",
      primary_email: null,
      secondary_email: "ada@example.com",
    });

    try {
      await sendNewMemberVerificationEmail({ userId: USER_UUID });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.message).to.include("primary email");
    }
    expect(mockSendEmail.called).to.be.false;
  });
});
