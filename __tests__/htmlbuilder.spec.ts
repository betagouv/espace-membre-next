import chai from "chai";

import htmlBuilder from "../src/lib/htmlbuilder";
import { incubatorSchemaType } from "@/models/incubator";
import { memberBaseInfoSchemaType } from "@/models/member";
import { userStartupSchemaType } from "@/models/startup";
import { EMAIL_TYPES } from "@/lib/email/email";
chai.should();

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
