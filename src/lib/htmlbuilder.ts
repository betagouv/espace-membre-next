import ejs from "ejs";
import mjml2html from "mjml";
import path from "path";
import TurndownService from "turndown";

import * as mdtohtml from "@/lib/mdtohtml";
import { getBaseUrl } from "@/lib/url";
import {
  EMAIL_TYPES,
  EmailProps,
  HtmlBuilderType,
  SubjectFunction,
} from "@/lib/email/email";
import { ApiKeyReminderEmailTitle } from "@/server/views/templates/emails/ApiKeyReminderEmail/ApiKeyReminderEmail";
import { EmailCreatedDimailTitle } from "@/server/views/templates/emails/EmailCreatedDimail/EmailCreatedDimail";
import { LoginEmailTitle } from "@/server/views/templates/emails/LoginEmail/LoginEmail";
import { MemberValidationEmailTitle } from "@/server/views/templates/emails/memberValidationEmail/memberValidationEmail";
import { StartupNewMemberArrivalEmailTitle } from "@/server/views/templates/emails/StartupNewMemberArrivalEmail/StartupNewMemberArrivalEmail";
import { VerificationWaitingEmailTitle } from "@/server/views/templates/emails/VerificationWaitingEmail/VerificationWaitingEmail";
import { BusinessError } from "@/lib/error";

const EMAILS_DIR = path.join(process.cwd(), "src/server/views/templates/emails");
const MJML_LAYOUT_PATH = path.join(EMAILS_DIR, "_layout.mjml.ejs");

// Templates are plain MJML markup rendered through EJS rather than JSX/mjml-react.
// mjml-react's JSX tree crosses Next's RSC bundling boundary and gets rejected
// by react-dom's real renderer (two different React element tags meeting at
// the render call) once anything reachable from a Route Handler imports it,
// so email bodies are authored as .mjml.ejs files wrapped in a shared layout
// instead of React components.
const TEMPLATES_BY_TYPE: Record<EmailProps["type"], string | null> = {
  EMAIL_LOGIN: path.join(EMAILS_DIR, "LoginEmail/LoginEmail.mjml.ejs"),
  EMAIL_CREATED_DIMAIL: path.join(
    EMAILS_DIR,
    "EmailCreatedDimail/EmailCreatedDimail.mjml.ejs",
  ),
  EMAIL_STARTUP_ASK_PHASE: null,
  EMAIL_VERIFICATION_WAITING: path.join(
    EMAILS_DIR,
    "VerificationWaitingEmail/VerificationWaitingEmail.mjml.ejs",
  ),
  EMAIL_NEW_MEMBER_VALIDATION: path.join(
    EMAILS_DIR,
    "memberValidationEmail/memberValidationEmail.mjml.ejs",
  ),
  [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]: path.join(
    EMAILS_DIR,
    "StartupNewMemberArrivalEmail/StartupNewMemberArrivalEmail.mjml.ejs",
  ),
  [EMAIL_TYPES.EMAIL_API_KEY_REMINDER]: path.join(
    EMAILS_DIR,
    "ApiKeyReminderEmail/ApiKeyReminderEmail.mjml.ejs",
  ),
};

const SUBJECTS_BY_TYPE: Record<EmailProps["type"], string | SubjectFunction> = {
  EMAIL_LOGIN: LoginEmailTitle(),
  EMAIL_CREATED_DIMAIL: EmailCreatedDimailTitle(),
  EMAIL_STARTUP_ASK_PHASE: "",
  EMAIL_VERIFICATION_WAITING: VerificationWaitingEmailTitle(),
  EMAIL_NEW_MEMBER_VALIDATION: MemberValidationEmailTitle(),
  [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]:
    StartupNewMemberArrivalEmailTitle(),
  // La FONCTION et non son appel : le sujet depend de la branche `event`.
  [EMAIL_TYPES.EMAIL_API_KEY_REMINDER]: ApiKeyReminderEmailTitle,
};

// Legacy plain-HTML/markdown .ejs templates (see the orphaned .ejs files
// still in this directory) go through renderFile as-is instead of the MJML
// layout wrap; none of the currently wired-up types use this path.
const MARKDOWN_BY_TYPE: Record<EmailProps["type"], boolean> = {
  EMAIL_LOGIN: false,
  EMAIL_CREATED_DIMAIL: false,
  EMAIL_STARTUP_ASK_PHASE: false,
  EMAIL_VERIFICATION_WAITING: false,
  EMAIL_NEW_MEMBER_VALIDATION: false,
  [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]: false,
  [EMAIL_TYPES.EMAIL_API_KEY_REMINDER]: false,
};

function getSubjectForType(type: EmailProps["type"], variables: any): string {
  const subject = SUBJECTS_BY_TYPE[type];
  return typeof subject === "function"
    ? (subject as SubjectFunction)(variables)
    : (subject as string);
}

async function renderMjmlEjsToHtml(
  templatePath: string,
  type: EmailProps["type"],
  variables: any,
): Promise<string> {
  const title = getSubjectForType(type, variables);
  const contentPartial = await ejs.renderFile(templatePath, {
    ...variables,
    title,
  });
  const mjmlSource = await ejs.renderFile(MJML_LAYOUT_PATH, {
    title,
    baseUrl: getBaseUrl(),
    currentYear: new Date().getFullYear(),
    content: contentPartial,
  });
  const transformResult = await mjml2html(mjmlSource);
  if (transformResult.errors) {
    for (const err of transformResult.errors) {
      throw err;
    }
  }
  return transformResult.html;
}

function htmlToEmailMarkdown(html: string): string {
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
  return turndownService.turndown(html);
}

const htmlBuilder: HtmlBuilderType = {
  renderContentForType: async ({ type, variables }) => {
    const templatePath = TEMPLATES_BY_TYPE[type];
    if (templatePath === null) {
      throw new BusinessError(
        "noEmailTemplateExists",
        `Il n'y pas de template d'email pour ${type}`,
      );
    }
    if (MARKDOWN_BY_TYPE[type]) {
      // legacy plain ejs/markdown template
      return mdtohtml.renderHtmlFromMd(
        await ejs.renderFile(templatePath, variables),
      );
    }
    return renderMjmlEjsToHtml(templatePath, type, variables);
  },
  renderFile: ejs.renderFile,
  templates: TEMPLATES_BY_TYPE,
  renderContentForTypeAsMarkdown: async ({ type, variables }) => {
    const templatePath = TEMPLATES_BY_TYPE[type];
    if (templatePath === null) {
      throw new BusinessError(
        "noEmailTemplateExists",
        `Il n'y pas de template d'email pour ${type}`,
      );
    }
    if (MARKDOWN_BY_TYPE[type]) {
      return ejs.renderFile(templatePath, variables);
    }
    const html = await renderMjmlEjsToHtml(templatePath, type, variables);
    return htmlToEmailMarkdown(html);
  },
  renderSubjectForType: ({ type, variables }) =>
    getSubjectForType(type, variables),
  subjects: SUBJECTS_BY_TYPE,
};

export default htmlBuilder;
