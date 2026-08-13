import chai from "chai";

import htmlBuilder from "../src/lib/htmlbuilder";
import { incubatorSchemaType } from "@/models/incubator";
import { memberBaseInfoSchemaType } from "@/models/member";
import { userStartupSchemaType } from "@/models/startup";
import { EMAIL_TYPES } from "@/lib/email/email";
chai.should();

describe(`Test EMAIL_LOGIN`, () => {
  it(`email EMAIL_LOGIN renders the magic link and fullname`, async () => {
    const loginUrlWithToken: string = "http://localhost:8100/signin?token=abc";

    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_LOGIN,
      variables: {
        loginUrlWithToken,
        fullname: "Jean Paul",
      },
    });
    emailBody.should.include(loginUrlWithToken);
    emailBody.should.include("Jean Paul");
  });
});

describe(`Test EMAIL_CREATED_DIMAIL`, () => {
  it(`email EMAIL_CREATED_DIMAIL renders the webmail credentials`, async () => {
    const webmailUrl: string = "http://webmail-url";

    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL,
      variables: {
        email: "jean.paul@betagouv.ovh",
        password: "tempPassword123",
        webmailUrl,
      },
    });
    emailBody.should.include(webmailUrl);
    emailBody.should.include("jean.paul@betagouv.ovh");
    emailBody.should.include("tempPassword123");
  });
});

describe(`Test EMAIL_STARTUP_NEW_MEMBER_ARRIVAL`, () => {
  it(`email EMAIL_STARTUP_NEW_MEMBER_ARRIVAL renders the new member and startup name`, async () => {
    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL,
      variables: {
        userInfos: {
          fullname: "Jean Paul",
          role: "développeur",
        } as memberBaseInfoSchemaType,
        startup: {
          name: "Une startup",
        } as userStartupSchemaType,
      },
    });
    emailBody.should.include("Jean Paul");
    emailBody.should.include("Une startup");
  });
});

describe(`Test EMAIL_VERIFICATION_WAITING`, () => {
  it(`email EMAIL_VERIFICATION_WAITING`, async () => {
    const secretariatUrl: string = "http://secretariat-url";

    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING,
      variables: {
        secretariatUrl,
        secondaryEmail: "toto@gmail.com",
        fullname: "Lucas Thenet",
      },
    });
    emailBody.should.include(secretariatUrl);
  });
});

describe(`Test EMAIL_NEW_MEMBER_VALIDATION`, () => {
  it(`email EMAIL_NEW_MEMBER_VALIDATION`, async () => {
    const secretariatUrl: string = "http://secretariat-url";

    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION,
      variables: {
        validationLink: secretariatUrl,
        userInfos: {
          fullname: "Jean Paul",
        } as memberBaseInfoSchemaType,
        startups: [
          {
            name: "Une startup",
          } as userStartupSchemaType,
        ],
        incubator: {
          title: "un super incubateur",
        } as incubatorSchemaType,
      },
    });
    emailBody.should.include(secretariatUrl);
  });
});
