// import { DBUser, DBUserWithEmailsAndMattermostUsername } from "@/models/dbUser";
import { StartupsPhaseEnum } from "@/@types/db";
import { incubatorSchemaType } from "@/models/incubator";
import { Job } from "@/models/job";
import { CreateOrUpdateMatomoAccountDataSchemaType } from "@/models/jobs/services";
import {
  memberBaseInfoSchemaType,
  memberPublicInfoSchemaType,
} from "@/models/member";
import { missionSchemaType } from "@/models/mission";
import {
  StartupPhase,
  startupSchemaType,
  userStartupSchemaType,
} from "@/models/startup";

export enum EMAIL_TYPES {
  EMAIL_LOGIN = "EMAIL_LOGIN",
  EMAIL_CREATED_EMAIL = "EMAIL_CREATED_EMAIL",
  EMAIL_CREATED_DIMAIL = "EMAIL_CREATED_DIMAIL",
  EMAIL_MATTERMOST_ACCOUNT_CREATED = "EMAIL_MATTERMOST_ACCOUNT_CREATED",
  EMAIL_ENDING_CONTRACT_2_DAYS = "EMAIL_ENDING_CONTRACT_2_DAYS",
  EMAIL_ENDING_CONTRACT_15_DAYS = "EMAIL_ENDING_CONTRACT_15_DAYS",
  EMAIL_ENDING_CONTRACT_30_DAYS = "EMAIL_ENDING_CONTRACT_30_DAYS",
  EMAIL_NO_MORE_CONTRACT_1_DAY = "EMAIL_NO_MORE_CONTRACT_1_DAY",
  EMAIL_NO_MORE_CONTRACT_30_DAY = "EMAIL_NO_MORE_CONTRACT_30_DAY",
  EMAIL_USER_SHOULD_UPDATE_INFO = "EMAIL_USER_SHOULD_UPDATE_INFO",
  EMAIL_NEWSLETTER = "EMAIL_NEWSLETTER",
  EMAIL_NEW_MEMBER_PR = "EMAIL_NEW_MEMBER_PR",
  EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE = "EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE",
  EMAIL_STARTUP_ENTER_ACCELERATION_PHASE = "EMAIL_STARTUP_ENTER_ACCELERATION_PHASE",
  EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE = "EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE",
  EMAIL_STARTUP_ASK_PHASE = "EMAIL_STARTUP_ASK_PHASE",
  EMAIL_FORUM_REMINDER = "EMAIL_FORUM_REMINDER",
  EMAIL_TEST = "EMAIL_TEST",
  EMAIL_VERIFICATION_WAITING = "EMAIL_VERIFICATION_WAITING",
  EMAIL_NEW_MEMBER_VALIDATION = "EMAIL_NEW_MEMBER_VALIDATION",
  EMAIL_TEAM_COMPOSITION = "EMAIL_TEAM_COMPOSITION",
  EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS = "EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS",
  EMAIL_STARTUP_NEW_MEMBER_ARRIVAL = "EMAIL_STARTUP_NEW_MEMBER_ARRIVAL",
  EMAIL_MATOMO_ACCOUNT_CREATED = "EMAIL_MATOMO_ACCOUNT_CREATED",
  EMAIL_MATOMO_ACCOUNT_UPDATED = "EMAIL_MATOMO_ACCOUNT_UPDATED",
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

export type EmailCreatedEmail = {
  type: EMAIL_TYPES.EMAIL_CREATED_EMAIL;
  variables: {
    email: string;
    secondaryEmail: string;
    secretariatUrl: string;
    emailUrl: string;
  };
};

export type EmailCreatedDimail = {
  type: EMAIL_TYPES.EMAIL_CREATED_DIMAIL;
  variables: {
    email: string;
    webmailUrl: string;
  };
};

export type EmailMattermostAccountCreated = {
  type: EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED;
  variables: {
    resetPasswordLink: string;
    fullname: string;
    email: string;
  };
};

export type EmailEndingContract = {
  type:
    | EMAIL_TYPES.EMAIL_ENDING_CONTRACT_30_DAYS
    | EMAIL_TYPES.EMAIL_ENDING_CONTRACT_15_DAYS
    | EMAIL_TYPES.EMAIL_ENDING_CONTRACT_2_DAYS;
  variables: {
    user: {
      userInfos: memberPublicInfoSchemaType;
      mattermostUsername: string;
    };
    endDate: Date;
    jobs: Job[];
    days: 2 | 15 | 30;
  };
};

export type EmailNoMoreContract = {
  type:
    | EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_1_DAY
    | EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_30_DAY;
  variables: {
    user: memberBaseInfoSchemaType;
    days: 1 | 30;
  };
};

export type EmailUserShouldUpdateInfo = {
  type: EMAIL_TYPES.EMAIL_USER_SHOULD_UPDATE_INFO;
  variables: {
    user: memberBaseInfoSchemaType;
    secretariatUrl: string;
  };
};

export type EmailNewsletter = {
  type: EMAIL_TYPES.EMAIL_NEWSLETTER;
  variables: {
    body: string;
    subject: string;
  };
};

export type EmailNewMemberPR = {
  type: EMAIL_TYPES.EMAIL_NEW_MEMBER_PR;
  variables: {
    prUrl: string;
    name: string;
    isEmailBetaAsked: boolean;
    startup: string;
  };
};

export type EmailStartupEnterConstructionPhase = {
  type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE;
  variables: {
    startup: string;
  };
};

export type EmailStartupEnterAccelerationPhase = {
  type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_ACCELERATION_PHASE;
  variables: {
    startup: string;
  };
};

export type EmailStartupEnterInvestigationPhase = {
  type: EMAIL_TYPES.EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE;
  variables: {
    startup: string;
  };
};

export type EmailStartupAskPhase = {
  type: EMAIL_TYPES.EMAIL_STARTUP_ASK_PHASE;
  variables: {
    startup: string;
    readablePhase: string;
    link: string;
    phase: StartupsPhaseEnum;
  };
};

export type EmailForumReminder = {
  type: EMAIL_TYPES.EMAIL_FORUM_REMINDER;
  variables: {
    date: string;
    calendar_public_url: string;
    location: string;
  };
};

export type EmailTest = {
  type: EMAIL_TYPES.EMAIL_TEST;
  variables?: {};
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

export type EmailTeamComposition = {
  type: EMAIL_TYPES.EMAIL_TEAM_COMPOSITION;
  variables: {
    activeMembers: {
      member: memberPublicInfoSchemaType;
      activeMission: missionSchemaType;
    }[];
    startup: startupSchemaType;
    memberAccountLink: string;
  };
};

export type EmailStartupMembersDidNotChangeInXMonths = {
  type: EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS;
  variables: {
    startupWrappers: {
      startup: startupSchemaType;
      activeMembers: number;
      lastModification?: Date;
      currentPhase: string;
    }[];
    incubator: incubatorSchemaType;
  };
};

export type EmailStartupNewMemberArrival = {
  type: EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL;
  variables: {
    userInfos: memberPublicInfoSchemaType;
    startup: userStartupSchemaType;
  };
};

export type EmailMatomoAccountCreated = {
  type: EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_CREATED;
  variables: {
    fullname: string;
    matomoResetUrl: string;
    email: string;
    newSite: CreateOrUpdateMatomoAccountDataSchemaType["newSite"];
    sites: CreateOrUpdateMatomoAccountDataSchemaType["sites"];
  };
};

export type EmailMatomoAccountUpdated = {
  type: EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_UPDATED;
  variables: {
    fullname: string;
    matomoUrl: string;
    email: string;
    newSite: CreateOrUpdateMatomoAccountDataSchemaType["newSite"];
    sites: CreateOrUpdateMatomoAccountDataSchemaType["sites"];
  };
};

export type EmailVariants =
  | EmailLogin
  | EmailCreatedEmail
  | EmailCreatedDimail
  | EmailMattermostAccountCreated
  | EmailEndingContract
  | EmailNoMoreContract
  | EmailUserShouldUpdateInfo
  | EmailNewsletter
  | EmailNewMemberPR
  | EmailStartupEnterConstructionPhase
  | EmailStartupEnterAccelerationPhase
  | EmailStartupEnterInvestigationPhase
  | EmailStartupNewMemberArrival
  | EmailStartupAskPhase
  | EmailForumReminder
  | EmailTest
  | EmailVerificationWaiting
  | EmailNewMemberValidation
  | EmailTeamComposition
  | EmailStartupMembersDidNotChangeInXMonths
  | EmailMatomoAccountCreated
  | EmailMatomoAccountUpdated;

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
  [EMAIL_TYPES.EMAIL_CREATED_EMAIL]: {
    description:
      "Email envoyé lors de la création d’un nouvel email dans le système.",
  },
  [EMAIL_TYPES.EMAIL_CREATED_DIMAIL]: {
    description: "Email envoyé lors de la création d’une boite mail Dimail.",
  },
  [EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED]: {
    description: "Notification de création d’un compte Mattermost.",
  },
  [EMAIL_TYPES.EMAIL_ENDING_CONTRACT_2_DAYS]: {
    description:
      "Alerte indiquant que le contrat d’un membre se termine dans 2 jours.",
  },
  [EMAIL_TYPES.EMAIL_ENDING_CONTRACT_15_DAYS]: {
    description:
      "Alerte indiquant que le contrat d’un membre se termine dans 15 jours.",
  },
  [EMAIL_TYPES.EMAIL_ENDING_CONTRACT_30_DAYS]: {
    description:
      "Alerte indiquant que le contrat d’un membre se termine dans 30 jours.",
  },
  [EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_1_DAY]: {
    description:
      "Notification qu’un membre n’aura plus de contrat actif demain.",
  },
  [EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_30_DAY]: {
    description:
      "Notification qu’un membre n’aura plus de contrat actif dans 30 jours.",
  },
  [EMAIL_TYPES.EMAIL_USER_SHOULD_UPDATE_INFO]: {
    description:
      "Rappel à un utilisateur de mettre à jour ses informations personnelles.",
  },
  [EMAIL_TYPES.EMAIL_NEWSLETTER]: {
    description: "Email de type newsletter envoyé aux utilisateurs.",
  },
  [EMAIL_TYPES.EMAIL_NEW_MEMBER_PR]: {
    description: "Notification de création de PR pour un nouveau membre.",
  },
  [EMAIL_TYPES.EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE]: {
    description: "Notification qu'une startup entre en phase de construction.",
  },
  [EMAIL_TYPES.EMAIL_STARTUP_ENTER_ACCELERATION_PHASE]: {
    description: "Notification qu'une startup entre en phase d’accélération.",
  },
  [EMAIL_TYPES.EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE]: {
    description: "Notification qu'une startup entre en phase d’investigation.",
  },
  [EMAIL_TYPES.EMAIL_STARTUP_ASK_PHASE]: {
    description:
      "Demande envoyée pour confirmer ou changer la phase d'une startup.",
  },
  [EMAIL_TYPES.EMAIL_FORUM_REMINDER]: {
    description: "Rappel envoyé pour participer à un forum.",
  },
  [EMAIL_TYPES.EMAIL_TEST]: {
    description:
      "Email de test pour vérifier le bon fonctionnement des envois.",
  },
  [EMAIL_TYPES.EMAIL_VERIFICATION_WAITING]: {
    description: "Email informant qu’une vérification est en attente.",
  },
  [EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION]: {
    description: "Demande de validation pour un nouveau membre.",
  },
  [EMAIL_TYPES.EMAIL_TEAM_COMPOSITION]: {
    description: "Email résumant la composition actuelle d’une équipe.",
  },
  [EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS]: {
    description:
      "Alerte lorsqu'aucun changement n’a été fait sur l’équipe d’une startup depuis X mois.",
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
};
