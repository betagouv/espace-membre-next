import { incubatorSchemaType } from "@/models/incubator";
import { memberPublicInfoSchemaType } from "@/models/member";
import { userStartupSchemaType } from "@/models/startup";

export enum EMAIL_TYPES {
  EMAIL_LOGIN = "EMAIL_LOGIN",
  EMAIL_CREATED_DIMAIL = "EMAIL_CREATED_DIMAIL",
  EMAIL_STARTUP_ASK_PHASE = "EMAIL_STARTUP_ASK_PHASE",
  EMAIL_VERIFICATION_WAITING = "EMAIL_VERIFICATION_WAITING",
  EMAIL_NEW_MEMBER_VALIDATION = "EMAIL_NEW_MEMBER_VALIDATION",
  EMAIL_STARTUP_NEW_MEMBER_ARRIVAL = "EMAIL_STARTUP_NEW_MEMBER_ARRIVAL",
  EMAIL_MATOMO_ACCOUNT_CREATED = "EMAIL_MATOMO_ACCOUNT_CREATED",
  EMAIL_MATOMO_ACCOUNT_UPDATED = "EMAIL_MATOMO_ACCOUNT_UPDATED",
  EMAIL_API_KEY_REMINDER = "EMAIL_API_KEY_REMINDER",
}

export type SubjectFunction = {
  (variables: EmailProps["variables"]): string;
};

export type HtmlBuilderType = {
  renderFile(url: string, params: any): Promise<string>;
  templates: Record<EmailProps["type"], string | null | any>;
  subjects: Record<EmailProps["type"], string | SubjectFunction>;
  renderContentForType: (params: EmailVariants) => Promise<string>;
  renderSubjectForType: (params: EmailVariants) => string;
  renderContentForTypeAsMarkdown: (params: EmailVariants) => Promise<string>;
};

type BaseEmail = {
  subject?: string;
  variables: Record<string, any>;
  toEmail: string[];
  extraParams?: Record<string, string>;
  attachments?: any[];
};

export type EmailLogin = {
  type: EMAIL_TYPES.EMAIL_LOGIN;
  variables: {
    loginUrlWithToken: string;
    fullname: string;
  };
};

export type EmailCreatedDimail = {
  type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL;
  variables: {
    password: string;
    email: string;
    webmailUrl: string;
  };
};

export type EmailStartupAskPhase = {
  type: EMAIL_TYPES.EMAIL_STARTUP_ASK_PHASE;
  variables: {
    startup: string;
    readablePhase: string;
    link: string;
    phase: string;
  };
};

export type EmailVerificationWaiting = {
  type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING;
  variables: {
    secondaryEmail: string;
    secretariatUrl: string;
    fullname: string;
  };
};

export type EmailNewMemberValidation = {
  type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION;
  variables: {
    userInfos: memberPublicInfoSchemaType;
    startups: userStartupSchemaType[];
    incubator: incubatorSchemaType;
    validationLink: string;
  };
};

export type EmailStartupNewMemberArrival = {
  type: EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL;
  variables: {
    userInfos: memberPublicInfoSchemaType;
    startup: userStartupSchemaType;
  };
};

// Un seul type pour deux usages, discrimines par `event` : la notification de
// creation d'une clef d'application et le rappel des clefs sans expiration. Le
// corps ne contient JAMAIS le jeton, seulement son prefixe.
export type EmailApiKeyReminder = {
  type: EMAIL_TYPES.EMAIL_API_KEY_REMINDER;
  variables: {
    event: "created" | "reminder";
    keyName: string;
    tokenPrefix: string;
    kindLabel: string;
    createdAt: string;
    manageUrl: string;
    // Branche reminder uniquement. ageInDays se compte depuis la date de
    // reference, c'est-a-dire depuis confirmedAt s'il existe, et non depuis la
    // creation : sans confirmedAt le corps annoncerait un age faux.
    ageInDays?: number;
    confirmedAt?: string | null;
    confirmUrl?: string;
    revokeUrl?: string;
    // Branche created uniquement.
    scopesLabel?: string;
    perimeterLabel?: string;
    createdByFullname?: string;
  };
};

export type EmailVariants =
  | EmailLogin
  | EmailCreatedDimail
  | EmailStartupNewMemberArrival
  | EmailStartupAskPhase
  | EmailVerificationWaiting
  | EmailNewMemberValidation
  | EmailApiKeyReminder;

export type EmailProps = BaseEmail & EmailVariants;

export type SendEmailProps = EmailProps & {
  subject?: string;
  // type: EmailProps["type"];
  // variables: EmailProps["variables"];
  forceTemplate?: boolean;
  toEmail: string[];
  extraParams?: Record<string, string>;
  attachments?: any[];
  replyTo?: string;
  headers?: Record<string, string | number>;
  bcc?: string[];
  htmlContent?: string;
};

export type SendCampaignEmailProps = {
  subject?: string;
  variables: EmailProps["variables"];
  type: EmailProps["type"];
  forceTemplate?: boolean;
  extraParams?: Record<string, string>;
  attachments?: any[];
  replyTo?: string;
  headers?: Record<string, string | number>;
  htmlContent?: string;
  mailingListType: MAILING_LIST_TYPE;
  campaignName: string;
};

export interface Contact {
  domaine?: string;
  emailBlacklisted?: boolean;
  email: string;
  firstname?: string;
  lastname?: string;
}

export interface AddContactsToMailingListsProps {
  listTypes: MAILING_LIST_TYPE[];
  contacts: Contact[];
}

export interface RemoveContactsFromMailingListProps {
  listType: MAILING_LIST_TYPE;
  emails: string[];
}

export interface UpdateContactEmailProps {
  previousEmail: string;
  newEmail: string;
}

export type SendEmail = (email: SendEmailProps) => Promise<null>;

export type SendCampaignEmail = (
  props: SendCampaignEmailProps,
) => Promise<null>;

export type AddContactsToMailingLists = (
  props: AddContactsToMailingListsProps,
) => Promise<null>;

export type UpdateContactEmail = (
  props: UpdateContactEmailProps,
) => Promise<null>;

export type RemoveContactsFromMailingList = (
  props: RemoveContactsFromMailingListProps,
) => Promise<null>;

export type SmtpBlockedContactsEmailDelete = (props: {
  email: string;
}) => Promise<null>;

export type GetAllTransacBlockedContacts = (props: {
  startDate: Date;
  endDate: Date;
  offset: number;
  senders?: string[];
}) => Promise<Contact[]>;

export type GetAllContacts = (props: { offset: number }) => Promise<Contact[]>;

export type GetAllContactsFromList = (props: {
  listId: number;
}) => Promise<Contact[]>;

export type UnblacklistContactEmail = (props: {
  email: string;
}) => Promise<void>;

export type GetContactInfo = (props: { email: string }) => Promise<Contact>;

export interface IMailingService {
  removeContactsFromMailingList: RemoveContactsFromMailingList;
  sendEmail: SendEmail;
  addContactsToMailingLists: AddContactsToMailingLists;
  sendCampaignEmail: SendCampaignEmail;
  updateContactEmail: UpdateContactEmail;
  unblacklistContactEmail: UnblacklistContactEmail;
  smtpBlockedContactsEmailDelete: SmtpBlockedContactsEmailDelete;
  getAllTransacBlockedContacts: GetAllTransacBlockedContacts;
  getAllContacts: GetAllContacts;
  getAllContactsFromList: GetAllContactsFromList;
  getContactInfo: GetContactInfo;
}

export enum MAILING_LIST_TYPE {
  ONBOARDING = "ONBOARDING",
  NEWSLETTER = "NEWSLETTER",
  TEST = "TEST",
  FORUM_REMINDER = "FORUM_REMINDER",
}

export const EmailDocumentation: Record<
  EMAIL_TYPES,
  {
    description: string;
  }
> = {
  [EMAIL_TYPES.EMAIL_LOGIN]: {
    description:
      "Email de login envoyé à la personne qui essaye de se connecter",
  },
  [EMAIL_TYPES.EMAIL_CREATED_DIMAIL]: {
    description: "Email envoyé lors de la création d’une boite mail Dimail.",
  },
  [EMAIL_TYPES.EMAIL_STARTUP_ASK_PHASE]: {
    description:
      "Demande envoyée pour confirmer ou changer la phase d'une startup.",
  },
  [EMAIL_TYPES.EMAIL_VERIFICATION_WAITING]: {
    description: "Email informant qu’une vérification est en attente.",
  },
  [EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION]: {
    description: "Demande de validation pour un nouveau membre.",
  },
  [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]: {
    description:
      "Notification de l’arrivée d’un nouveau membre dans une startup.",
  },
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_CREATED]: {
    description: "Email envoyé après la création d’un compte Matomo.",
  },
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_UPDATED]: {
    description: "Notification de mise à jour d’un compte Matomo.",
  },
  [EMAIL_TYPES.EMAIL_API_KEY_REMINDER]: {
    description:
      "Email de rappel d'une clef d'API sans expiration, et notification de création d'une clef d'application.",
  },
};
