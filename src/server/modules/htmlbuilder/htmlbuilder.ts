import { renderToMjml } from "@luma-team/mjml-react";
import ejs from "ejs";
import mjml2html from "mjml";

import * as mdtohtml from "@/lib/mdtohtml";
import { EmailCreatedEmail as EmailCreatedEmailType } from "@/server/modules/email";
import {
    EmailCreatedEmail,
    EmailCreatedEmailTitle,
} from "@/server/views/templates/emails/EmailCreatedEmail/EmailCreatedEmail";
import {
    LoginEmail,
    LoginEmailTitle,
} from "@/server/views/templates/emails/LoginEmail/LoginEmail";
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
import { BusinessError } from "@/utils/error";
import {
    EMAIL_TYPES,
    EmailLogin,
    EmailNewMemberValidation,
    EmailProps,
    EmailStartupMembersDidNotChangeInXMonths,
    EmailStartupNewMemberArrival,
    EmailTeamComposition,
    HtmlBuilderType,
    SubjectFunction,
} from "@modules/email";

const TEMPLATES_BY_TYPE: Record<EmailProps["type"], string | null | any> = {
    MARRAINAGE_NEWCOMER_EMAIL:
        "./src/server/views/templates/emails/marrainage/marrainageByGroupNewcomerEmail.ejs",
    MARRAINAGE_ONBOARDER_EMAIL:
        "./src/server/views/templates/emails/marrainage/marrainageByGroupOnboarderEmail.ejs",
    EMAIL_LOGIN: (params: EmailLogin["variables"]) => LoginEmail(params),
    MARRAINAGE_REQUEST_EMAIL:
        "./src/server/views/templates/emails/marrainage/marrainageRequest.ejs",
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL:
        "./src/server/views/templates/emails/marrainage/marrainageAcceptNewcomer.ejs",
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL:
        "./src/server/views/templates/emails/marrainage/marrainageAcceptOnboarder.ejs",
    MARRAINAGE_REQUEST_FAILED:
        "./src/server/views/templates/emails/marrainage/marrainageRequestFailed.ejs",
    ONBOARDING_REFERENT_EMAIL:
        "./src/server/views/templates/emails/onboardingReferent.ejs",
    EMAIL_CREATED_EMAIL: (params: EmailCreatedEmailType["variables"]) =>
        EmailCreatedEmail(params),
    EMAIL_MATTERMOST_ACCOUNT_CREATED:
        "./src/server/views/templates/emails/mattermost.ejs",
    EMAIL_PR_PENDING: `./src/server/views/templates/emails/pendingGithubAuthorPR.ejs`,
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
    EMAIL_PR_PENDING_TO_TEAM:
        "./src/server/views/templates/emails/prPendingToTeam.ejs",
    EMAIL_VERIFICATION_WAITING:
        "./src/server/views/templates/emails/verificationWaiting.ejs",
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
};

const SUBJECTS_BY_TYPE: Record<EmailProps["type"], string | SubjectFunction> = {
    MARRAINAGE_REQUEST_EMAIL: "Tu as été sélectionné·e comme marrain·e 🙌",
    EMAIL_LOGIN: LoginEmailTitle(),
    MARRAINAGE_NEWCOMER_EMAIL: "Découvre ta marraine ou ton parrain Beta !",
    MARRAINAGE_ONBOARDER_EMAIL: "Découvre tes filleuls Beta !",
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: "Mise en contact 👋",
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: "Mise en contact 👋",
    MARRAINAGE_REQUEST_FAILED: `La demande de marrainage n'a pas fonctionné`,
    ONBOARDING_REFERENT_EMAIL: ({ name }: EmailProps["variables"]) => {
        return `${name} vient de créer sa fiche Github`;
    },
    EMAIL_CREATED_EMAIL: EmailCreatedEmailTitle(),
    EMAIL_MATTERMOST_ACCOUNT_CREATED: "Inscription à mattermost",
    EMAIL_PR_PENDING: `PR en attente`,
    EMAIL_PR_PENDING_TO_TEAM: ({ username }: EmailProps["variables"]) => {
        return `PR en attente de ${username} en attente de merge`;
    },
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
    EMAIL_VERIFICATION_WAITING: "Bienvenue chez BetaGouv 🙂",
    EMAIL_NEW_MEMBER_VALIDATION: MemberValidationEmailTitle(),
    [EMAIL_TYPES.EMAIL_TEAM_COMPOSITION]: TeamCompositionEmailTitle(),
    [EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS]:
        StartupMembersDidNotChangeInXMonthsEmailTitle(),
    [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]:
        StartupNewMemberArrivalEmailTitle(),
};

const MARKDOWN_BY_TYPE: Record<EmailProps["type"], boolean> = {
    MARRAINAGE_NEWCOMER_EMAIL: true,
    MARRAINAGE_ONBOARDER_EMAIL: true,
    EMAIL_LOGIN: false,
    MARRAINAGE_REQUEST_EMAIL: false,
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL: false,
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL: false,
    MARRAINAGE_REQUEST_FAILED: false,
    ONBOARDING_REFERENT_EMAIL: true,
    EMAIL_CREATED_EMAIL: false,
    EMAIL_MATTERMOST_ACCOUNT_CREATED: false,
    EMAIL_PR_PENDING: true,
    EMAIL_PR_PENDING_TO_TEAM: true,
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
