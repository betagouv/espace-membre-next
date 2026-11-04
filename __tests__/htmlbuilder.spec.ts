import "chai/register-should";

import htmlBuilder from "../src/lib/htmlbuilder";
import { incubatorSchemaType } from "@/models/incubator";
import { memberBaseInfoSchemaType } from "@/models/member";
import { userStartupSchemaType } from "@/models/startup";
import { EMAIL_TYPES } from "@/lib/email/email";

// legacy-email-login: remove with src/lib/auth/legacyEmailLogin
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

describe(`Test EMAIL_LEGACY_LOGIN_REMINDER`, () => {
  const variables = {
    fullname: "Jean Paul",
    endDate: "1 décembre 2026",
    loginUrl: "http://espace-membre/login",
    supportUrl: "http://espace-membre/support",
  };

  it(`invites to log in with ProConnect with the primary email`, async () => {
    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_LEGACY_LOGIN_REMINDER,
      variables: { ...variables, loginEmail: "jean.paul@beta.gouv.fr" },
    });
    emailBody.should.include("1 décembre 2026");
    emailBody.should.include("jean.paul@beta.gouv.fr");
    emailBody.should.include(variables.loginUrl);
  });

  it(`points to the support page without a primary email`, async () => {
    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_LEGACY_LOGIN_REMINDER,
      variables: { ...variables, loginEmail: null },
    });
    emailBody.should.include(variables.supportUrl);
    emailBody.should.not.include(variables.loginUrl);
  });
});

describe(`Test EMAIL_CREATED_DIMAIL`, () => {
  it(`email EMAIL_CREATED_DIMAIL renders the webmail access link, without password`, async () => {
    const webmailUrl: string = "http://webmail-url/code/access-code";

    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL,
      variables: {
        email: "jean.paul@betagouv.ovh",
        webmailUrl,
      },
    });
    emailBody.should.include(webmailUrl);
    emailBody.should.include("jean.paul@betagouv.ovh");
    emailBody.should.not.include("mot de passe");
  });
});

describe(`Test EMAIL_CREATED_DIMAIL resend`, () => {
  it(`renders a new access link from the support, without the arrival text`, async () => {
    const webmailUrl = "http://webmail-url/code/new-code";
    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL,
      variables: {
        email: "jean.paul@beta.gouv.fr",
        webmailUrl,
        resend: true,
      },
    });
    emailBody.should.include(webmailUrl);
    emailBody.should.include("Nouveau lien d");
    emailBody.should.not.include("Et maintenant");
    htmlBuilder
      .renderSubjectForType({
        type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL,
        variables: {
          email: "jean.paul@beta.gouv.fr",
          webmailUrl,
          resend: true,
        },
      })
      .should.include("Nouveau lien");
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
  it(`email EMAIL_VERIFICATION_WAITING invites to log in with ProConnect`, async () => {
    const loginUrl: string = "http://espace-membre/login";

    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING,
      variables: {
        loginUrl,
        loginEmail: "lucas.thenet.ext@beta.gouv.fr",
        fullname: "Lucas Thenet",
      },
    });
    emailBody.should.include(loginUrl);
    emailBody.should.include("lucas.thenet.ext@beta.gouv.fr");
    emailBody.should.include("ProConnect");
    emailBody.should.not.include("token");
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

describe(`Test EMAIL_API_KEY_REMINDER`, () => {
  const base = {
    keyName: "Ma clef de production",
    tokenPrefix: "em1_ab12cd34",
    kindLabel: "clef d'application",
    createdAt: "01/01/2026",
    manageUrl: "http://localhost:8100/account/api-keys/abc",
  };

  it(`renders the reminder branch with its three calls to action`, async () => {
    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_API_KEY_REMINDER,
      variables: {
        ...base,
        event: "reminder",
        ageInDays: 90,
        confirmUrl: "http://localhost:8100/account/api-keys/abc?action=confirm",
        revokeUrl: "http://localhost:8100/account/api-keys/abc?action=revoke",
      },
    });
    emailBody.should.include("action=confirm");
    emailBody.should.include("action=revoke");
    emailBody.should.include(base.manageUrl);
  });

  it(`renders the created branch, without any confirmation link`, async () => {
    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_API_KEY_REMINDER,
      variables: {
        ...base,
        event: "created",
        scopesLabel: "startups:read",
        perimeterLabel: "incubator/mon-incubateur",
        createdByFullname: "Jean Paul",
      },
    });
    emailBody.should.include("startups:read");
    emailBody.should.not.include("action=confirm");
  });

  // Le corps ne contient JAMAIS le jeton, seulement son prefixe.
  it(`carries the prefix and never anything shaped like a full token`, async () => {
    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_API_KEY_REMINDER,
      variables: { ...base, event: "reminder", ageInDays: 180 },
    });
    emailBody.should.include(base.tokenPrefix);
    // 20 caracteres ou plus derriere em1_ : la forme d'un jeton complet.
    emailBody.should.not.match(/em1_[A-Za-z0-9_-]{20,}/);
  });

  /**
   * ageInDays se compte depuis la date de reference, donc depuis la
   * confirmation quand il y en a une. Sans cette branche, le corps annoncerait
   * « creee le 01/01/2026, il y a 90 jours » d'une clef vieille de 300 jours.
   */
  it(`dates a reminder from the confirmation once the key has been confirmed`, async () => {
    const emailBody: string = await htmlBuilder.renderContentForType({
      type: EMAIL_TYPES.EMAIL_API_KEY_REMINDER,
      variables: {
        ...base,
        event: "reminder",
        ageInDays: 90,
        confirmedAt: "15/06/2026",
      },
    });
    emailBody.should.include("15/06/2026");
    emailBody.should.include("confirmée le");
    // La date de creation reste affichee, elle n'est simplement plus celle qui
    // porte le « il y a N jours ».
    emailBody.should.include(base.createdAt);
  });

  it(`branches the subject on the event variable`, () => {
    const reminder = htmlBuilder.renderSubjectForType({
      type: EMAIL_TYPES.EMAIL_API_KEY_REMINDER,
      variables: { ...base, event: "reminder" },
    });
    const created = htmlBuilder.renderSubjectForType({
      type: EMAIL_TYPES.EMAIL_API_KEY_REMINDER,
      variables: { ...base, event: "created" },
    });
    reminder.should.not.equal(created);
    reminder.should.include(base.keyName);
  });
});
