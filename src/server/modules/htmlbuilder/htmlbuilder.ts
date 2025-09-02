import { renderToMjml } from "@luma-team/mjml-react";
import ejs from "ejs";
import e from "express";
import mjml2html from "mjml";
import TurndownService from "turndown";

import * as mdtohtml from "@/lib/mdtohtml";
import {
  EmailCreatedEmail as EmailCreatedEmailType,
  EmailNoMoreContract,
  EmailEndingContract,
  EmailVariants,
  EmailVerificationWaiting,
  EMAIL_TYPES,
  EmailLogin,
  EmailMattermostAccountCreated,
  EmailMatomoAccountCreated,
  EmailMatomoAccountUpdated,
  EmailNewMemberValidation,
  EmailProps,
  EmailStartupMembersDidNotChangeInXMonths,
  EmailStartupNewMemberArrival,
  EmailTeamComposition,
  HtmlBuilderType,
  SubjectFunction,
  EmailValidationWaitingRaise,
} from "@/server/modules/email";
import {
  DepartureReminderInXDaysEmail,
  DepartureReminderInXDaysEmailTitle,
} from "@/server/views/templates/emails/DepartureReminderInXDaysEmail/DepartureReminderInXDaysEmail";
import {
  EmailCreatedEmail,
  EmailCreatedEmailTitle,
} from "@/server/views/templates/emails/EmailCreatedEmail/EmailCreatedEmail";
import {
  LoginEmail,
  LoginEmailTitle,
} from "@/server/views/templates/emails/LoginEmail/LoginEmail";
import {
  MatomoAccountCreatedEmail,
  MatomoAccountCreatedEmailTitle,
} from "@/server/views/templates/emails/MatomoAccountCreatedEmail/MatomoAccountCreatedEmail";
import {
  MatomoAccountUpdatedEmail,
  MatomoAccountUpdatedEmailTitle,
} from "@/server/views/templates/emails/MatomoAccountUpdatedEmail/MatomoAccountUpdatedEmail";
import {
  MattermostAccountCreatedEmail,
  MattermostAccountCreatedEmailTitle,
} from "@/server/views/templates/emails/MattermostAccountCreatedEmail/MattermostAccountCreatedEmail";
import {
  MemberValidationEmail,
  MemberValidationEmailTitle,
} from "@/server/views/templates/emails/memberValidationEmail/memberValidationEmail";
import {
  NoMoreContractXDaysEmailTitle,
  NoMoreContractXDaysEmail,
} from "@/server/views/templates/emails/NoMoreContractEmail/NoMoreContractXDaysEmail";
import {
  StartupMembersDidNotChangeInXMonthsEmail,
  StartupMembersDidNotChangeInXMonthsEmailTitle,
} from "@/server/views/templates/emails/startupMembersDidNotChangeInXMonthsEmail/startupMembersDidNotChangeInXMonthsEmail";
import {
  StartupNewMemberArrivalEmail,
  StartupNewMemberArrivalEmailTitle,
} from "@/server/views/templates/emails/StartupNewMemberArrivalEmail/StartupNewMemberArrivalEmail";
import {
  TeamCompositionEmail,
  TeamCompositionEmailTitle,
} from "@/server/views/templates/emails/teamCompositionEmail/teamCompositionEmail";
import {
  VerificationWaitingEmail,
  VerificationWaitingEmailTitle,
} from "@/server/views/templates/emails/VerificationWaitingEmail/VerificationWaitingEmail";
import { BusinessError } from "@/utils/error";

const TEMPLATES_BY_TYPE: Record<
  EmailProps["type"],
  string | null | ((params: any) => JSX.Element)
> = {
  EMAIL_LOGIN: (params: EmailLogin["variables"]) => LoginEmail(params),
  [EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED]: (
    params: EmailMattermostAccountCreated["variables"],
  ) => MattermostAccountCreatedEmail(params),
  EMAIL_CREATED_EMAIL: (params: EmailCreatedEmailType["variables"]) =>
    EmailCreatedEmail(params),
  EMAIL_NO_MORE_CONTRACT_1_DAY: (params: EmailNoMoreContract["variables"]) =>
    NoMoreContractXDaysEmail(params),
  EMAIL_NO_MORE_CONTRACT_30_DAY: (params: EmailNoMoreContract["variables"]) =>
    NoMoreContractXDaysEmail(params),
  EMAIL_ENDING_CONTRACT_2_DAYS: (params: EmailEndingContract["variables"]) =>
    DepartureReminderInXDaysEmail(params),
  EMAIL_ENDING_CONTRACT_15_DAYS: (params: EmailEndingContract["variables"]) =>
    DepartureReminderInXDaysEmail(params),
  EMAIL_ENDING_CONTRACT_30_DAYS: (params: EmailEndingContract["variables"]) =>
    DepartureReminderInXDaysEmail(params),
  EMAIL_USER_SHOULD_UPDATE_INFO: `./src/server/views/templates/emails/updateUserInfoEmail.ejs`,
  EMAIL_NEWSLETTER: "./src/server/views/templates/emails/newsletter.ejs",
  EMAIL_NEW_MEMBER_PR: "./src/server/views/templates/emails/newMemberPR.ejs",
  EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE:
    "./src/server/views/templates/emails/startupEnterConstructionPhase.ejs",
  EMAIL_STARTUP_ENTER_ACCELERATION_PHASE:
    "./src/server/views/templates/emails/startupEnterAccelerationPhase.ejs",
  EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE: null,
  EMAIL_STARTUP_ASK_PHASE: null,
  EMAIL_FORUM_REMINDER: null,
  EMAIL_TEST: null,
  EMAIL_VERIFICATION_WAITING: (params: EmailVerificationWaiting["variables"]) =>
    VerificationWaitingEmail(params),
  EMAIL_NEW_MEMBER_VALIDATION: (
    params: EmailNewMemberValidation["variables"],
  ) => MemberValidationEmail(params),
  [EMAIL_TYPES.EMAIL_TEAM_COMPOSITION]: (
    params: EmailTeamComposition["variables"],
  ) => TeamCompositionEmail(params),
  [EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS]: (
    params: EmailStartupMembersDidNotChangeInXMonths["variables"],
  ) => StartupMembersDidNotChangeInXMonthsEmail(params),
  [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]: (
    params: EmailStartupNewMemberArrival["variables"],
  ) => StartupNewMemberArrivalEmail(params),
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_CREATED]: (
    params: EmailMatomoAccountCreated["variables"],
  ) => MatomoAccountCreatedEmail(params),
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_UPDATED]: (
    params: EmailMatomoAccountUpdated["variables"],
  ) => MatomoAccountUpdatedEmail(params),
  [EMAIL_TYPES.EMAIL_VALIDATION_WAITING_RAISE]: null,
  [EMAIL_TYPES.EMAIL_VERIFICATION_WAITING_RAISE]: null,
};

const SUBJECTS_BY_TYPE: Record<EmailProps["type"], string | SubjectFunction> = {
  EMAIL_LOGIN: LoginEmailTitle(),
  EMAIL_MATTERMOST_ACCOUNT_CREATED: MattermostAccountCreatedEmailTitle(),
  EMAIL_CREATED_EMAIL: EmailCreatedEmailTitle(),
  EMAIL_NO_MORE_CONTRACT_1_DAY: NoMoreContractXDaysEmailTitle(),
  EMAIL_NO_MORE_CONTRACT_30_DAY: NoMoreContractXDaysEmailTitle(),
  EMAIL_ENDING_CONTRACT_2_DAYS: DepartureReminderInXDaysEmailTitle({
    days: 2,
  }),
  EMAIL_ENDING_CONTRACT_15_DAYS: DepartureReminderInXDaysEmailTitle({
    days: 15,
  }),
  EMAIL_ENDING_CONTRACT_30_DAYS: DepartureReminderInXDaysEmailTitle({
    days: 30,
  }),
  EMAIL_USER_SHOULD_UPDATE_INFO: "Mise à jour de tes informations",
  EMAIL_NEWSLETTER: ({ subject }: EmailProps["variables"]) => {
    return `${subject}`;
  },
  EMAIL_NEW_MEMBER_PR: ({ name }: EmailProps["variables"]) => {
    return `${name} vient de créer sa fiche Github`;
  },
  EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE: ({
    startup,
  }: EmailProps["variables"]) => {
    return `${startup} passe en construction : les bonnes pratiques`;
  },
  EMAIL_STARTUP_ENTER_ACCELERATION_PHASE: ({
    startup,
  }: EmailProps["variables"]) => {
    return `${startup} passe en acceleration : les bonnes pratiques`;
  },
  EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE: "",
  EMAIL_STARTUP_ASK_PHASE: "",
  EMAIL_FORUM_REMINDER: "",
  EMAIL_TEST: "",
  EMAIL_VERIFICATION_WAITING: VerificationWaitingEmailTitle(),
  EMAIL_NEW_MEMBER_VALIDATION: MemberValidationEmailTitle(),
  [EMAIL_TYPES.EMAIL_TEAM_COMPOSITION]: TeamCompositionEmailTitle(),
  [EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS]:
    StartupMembersDidNotChangeInXMonthsEmailTitle(),
  [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]:
    StartupNewMemberArrivalEmailTitle(),
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_CREATED]: MatomoAccountCreatedEmailTitle(),
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_UPDATED]: MatomoAccountUpdatedEmailTitle(),
  EMAIL_VALIDATION_WAITING_RAISE: "",
  EMAIL_VERIFICATION_WAITING_RAISE: "",
};

const MARKDOWN_BY_TYPE: Record<EmailProps["type"], boolean> = {
  EMAIL_LOGIN: false,
  EMAIL_CREATED_EMAIL: false,
  EMAIL_MATTERMOST_ACCOUNT_CREATED: false,
  EMAIL_ENDING_CONTRACT_2_DAYS: false,
  EMAIL_ENDING_CONTRACT_15_DAYS: false,
  EMAIL_ENDING_CONTRACT_30_DAYS: false,
  EMAIL_NO_MORE_CONTRACT_1_DAY: false,
  EMAIL_NO_MORE_CONTRACT_30_DAY: false,
  EMAIL_USER_SHOULD_UPDATE_INFO: true,
  EMAIL_NEWSLETTER: true,
  EMAIL_NEW_MEMBER_PR: true,
  EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE: true,
  EMAIL_STARTUP_ENTER_ACCELERATION_PHASE: true,
  EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE: false,
  EMAIL_STARTUP_ASK_PHASE: false,
  EMAIL_FORUM_REMINDER: false,
  EMAIL_TEST: false,
  EMAIL_VERIFICATION_WAITING: false,
  EMAIL_NEW_MEMBER_VALIDATION: false,
  [EMAIL_TYPES.EMAIL_TEAM_COMPOSITION]: false,
  [EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS]: false,
  [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]: false,
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_CREATED]: false,
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_UPDATED]: false,
  [EMAIL_TYPES.EMAIL_VALIDATION_WAITING_RAISE]: false,
  [EMAIL_TYPES.EMAIL_VERIFICATION_WAITING_RAISE]: false,
};

const htmlBuilder: HtmlBuilderType = {
  renderContentForType: async ({ type, variables }) => {
    let content: string;
    if (TEMPLATES_BY_TYPE[type] === null) {
      throw new BusinessError(
        "noEmailTemplateExists",
        `Il n'y pas de template d'email pour ${type}`,
      );
    } else if (typeof TEMPLATES_BY_TYPE[type] === "string") {
      // use legacy ejs file rendering
      content = await ejs.renderFile(TEMPLATES_BY_TYPE[type], variables);
      if (MARKDOWN_BY_TYPE[type]) {
        content = mdtohtml.renderHtmlFromMd(content);
      }
    } else {
      // use mjml
      const mjmlHtmlContent = renderToMjml(TEMPLATES_BY_TYPE[type](variables));
      const transformResult = mjml2html(mjmlHtmlContent);
      if (transformResult.errors) {
        for (const err of transformResult.errors) {
          throw err;
        }
      }

      const rawHtmlVersion = transformResult.html;
      // const plaintextVersion = convertHtmlEmailToText(rawHtmlVersion);
      content = rawHtmlVersion;
    }
    return content;
  },
  renderFile: ejs.renderFile,
  templates: TEMPLATES_BY_TYPE,
  renderContentForTypeAsMarkdown: async (params) => {
    const { type, variables } = params;
    if (TEMPLATES_BY_TYPE[type] === null) {
      throw new BusinessError(
        "noEmailTemplateExists",
        `Il n'y pas de template d'email pour ${type}`,
      );
    } else if (typeof TEMPLATES_BY_TYPE[type] === "string") {
      if (MARKDOWN_BY_TYPE[type]) {
        let content = await ejs.renderFile(TEMPLATES_BY_TYPE[type], variables);
        return content;
      } else {
        throw new BusinessError(
          "noMarkdownTemplateExists",
          `Il n'y pas de template d'email pour ${type}`,
        );
      }
    } else {
      // use mjml
      const mjmlHtmlContent = renderToMjml(TEMPLATES_BY_TYPE[type](variables));
      const transformResult = mjml2html(mjmlHtmlContent);

      if (transformResult.errors) {
        for (const err of transformResult.errors) {
          throw err;
        }
      }
      // use turndown to return clean markdown
      const turndownService = new TurndownService();
      turndownService.addRule("strikethrough", {
        filter: ["head", "script", "style", "img", "footer", "header"],
        replacement: function () {
          return "";
        },
      });
      turndownService.addRule("strikethrough", {
        filter: (node) => {
          return (
            node.getAttribute("class") === "header-section" ||
            node.getAttribute("class") === "footer-section"
          );
        },
        replacement: function () {
          return "";
        },
      });

      const rawHtmlVersion = transformResult.html;
      const markdown = turndownService.turndown(rawHtmlVersion);
      return markdown;
    }
  },
  renderSubjectForType: ({ type, variables }) => {
    let subject = "";
    if (typeof SUBJECTS_BY_TYPE[type] === "function") {
      const buildSubject = SUBJECTS_BY_TYPE[type] as SubjectFunction;
      subject = buildSubject(variables as EmailProps["variables"]);
    } else {
      subject = SUBJECTS_BY_TYPE[type] as string;
    }
    return subject;
  },
  subjects: SUBJECTS_BY_TYPE,
};

export default htmlBuilder;
