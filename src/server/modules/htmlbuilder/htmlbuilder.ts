import { renderToMjml } from "@luma-team/mjml-react";
import ejs from "ejs";
import mjml2html from "mjml";

import * as mdtohtml from "@/lib/mdtohtml";
import {
    EmailCreatedEmail as EmailCreatedEmailType,
    EmailVerificationWaiting,
} from "@/server/modules/email";
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
import {
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
} from "@modules/email";

const TEMPLATES_BY_TYPE: Record<EmailProps["type"], string | null | any> = {
    EMAIL_LOGIN: (params: EmailLogin["variables"]) => LoginEmail(params),
    [EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED]: (
        params: EmailMattermostAccountCreated["variables"]
    ) => MattermostAccountCreatedEmail(params),
    EMAIL_CREATED_EMAIL: (params: EmailCreatedEmailType["variables"]) =>
        EmailCreatedEmail(params),
    EMAIL_ENDING_CONTRACT_2_DAYS:
        "./src/server/views/templates/emails/mail2days.ejs",
    EMAIL_ENDING_CONTRACT_15_DAYS:
        "./src/server/views/templates/emails/mail15days.ejs",
    EMAIL_ENDING_CONTRACT_30_DAYS:
        "./src/server/views/templates/emails/mail30days.ejs",
    EMAIL_NO_MORE_CONTRACT_1_DAY:
        "./src/server/views/templates/emails/mailExpired1day.ejs",
    EMAIL_NO_MORE_CONTRACT_30_DAY:
        "./src/server/views/templates/emails/mailExpired30days.ejs",
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
    EMAIL_VERIFICATION_WAITING: (
        params: EmailVerificationWaiting["variables"]
    ) => VerificationWaitingEmail(params),
    EMAIL_NEW_MEMBER_VALIDATION: (
        params: EmailNewMemberValidation["variables"]
    ) => MemberValidationEmail(params),
    [EMAIL_TYPES.EMAIL_TEAM_COMPOSITION]: (
        params: EmailTeamComposition["variables"]
    ) => TeamCompositionEmail(params),
    [EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS]: (
        params: EmailStartupMembersDidNotChangeInXMonths["variables"]
    ) => StartupMembersDidNotChangeInXMonthsEmail(params),
    [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]: (
        params: EmailStartupNewMemberArrival["variables"]
    ) => StartupNewMemberArrivalEmail(params),
    [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_CREATED]: (
        params: EmailMatomoAccountCreated["variables"]
    ) => MatomoAccountCreatedEmail(params),
    [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_UPDATED]: (
        params: EmailMatomoAccountUpdated["variables"]
    ) => MatomoAccountUpdatedEmail(params),
};

const SUBJECTS_BY_TYPE: Record<EmailProps["type"], string | SubjectFunction> = {
    EMAIL_LOGIN: LoginEmailTitle(),
    EMAIL_MATTERMOST_ACCOUNT_CREATED: MattermostAccountCreatedEmailTitle(),
    EMAIL_CREATED_EMAIL: EmailCreatedEmailTitle(),
    EMAIL_ENDING_CONTRACT_2_DAYS: "Départ dans 2 jours 🙂",
    EMAIL_ENDING_CONTRACT_15_DAYS: "Départ dans 15 jours 🙂",
    EMAIL_ENDING_CONTRACT_30_DAYS: "Départ dans 30 jours 🙂",
    EMAIL_NO_MORE_CONTRACT_1_DAY: "A bientôt 🙂",
    EMAIL_NO_MORE_CONTRACT_30_DAY: "A bientôt 🙂",
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
    [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_CREATED]:
        MatomoAccountCreatedEmailTitle(),
    [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_UPDATED]:
        MatomoAccountUpdatedEmailTitle(),
};

const MARKDOWN_BY_TYPE: Record<EmailProps["type"], boolean> = {
    EMAIL_LOGIN: false,
    EMAIL_CREATED_EMAIL: false,
    EMAIL_MATTERMOST_ACCOUNT_CREATED: false,
    EMAIL_ENDING_CONTRACT_2_DAYS: true,
    EMAIL_ENDING_CONTRACT_15_DAYS: true,
    EMAIL_ENDING_CONTRACT_30_DAYS: true,
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
};

const htmlBuilder: HtmlBuilderType = {
    renderContentForType: async ({ type, variables }) => {
        let content: string;
        if (TEMPLATES_BY_TYPE[type] === null) {
            throw new BusinessError(
                "noEmailTemplateExists",
                `Il n'y pas de template d'email pour ${type}`
            );
        } else if (typeof TEMPLATES_BY_TYPE[type] === "string") {
            // use legacy ejs file rendering
            content = await ejs.renderFile(TEMPLATES_BY_TYPE[type], variables);
            if (MARKDOWN_BY_TYPE[type]) {
                content = mdtohtml.renderHtmlFromMd(content);
            }
        } else {
            // use mjml
            const mjmlHtmlContent = renderToMjml(
                TEMPLATES_BY_TYPE[type](variables)
            );
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
        if (!MARKDOWN_BY_TYPE[type]) {
            throw new Error(`There is no markdown file for ${type}`);
        }
        let content = await ejs.renderFile(TEMPLATES_BY_TYPE[type], variables);
        return content;
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
