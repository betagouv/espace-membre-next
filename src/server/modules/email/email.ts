// import { DBUser, DBUserWithEmailsAndMattermostUsername } from "@/models/dbUser";
import { Job } from "@/models/job";
import {
    memberBaseInfoSchemaType,
    memberPublicInfoSchemaType,
} from "@/models/member";
import { StartupPhase } from "@/models/startup";

export enum EMAIL_TYPES {
    MARRAINAGE_NEWCOMER_EMAIL = "MARRAINAGE_NEWCOMER_EMAIL",
    MARRAINAGE_ONBOARDER_EMAIL = "MARRAINAGE_ONBOARDER_EMAIL",
    LOGIN_EMAIL = "LOGIN_EMAIL",
    MARRAINAGE_REQUEST_EMAIL = "MARRAINAGE_REQUEST_EMAIL",
    MARRAINAGE_ACCEPT_NEWCOMER_EMAIL = "MARRAINAGE_ACCEPT_NEWCOMER_EMAIL",
    MARRAINAGE_ACCEPT_ONBOARDER_EMAIL = "MARRAINAGE_ACCEPT_ONBOARDER_EMAIL",
    MARRAINAGE_REJECT_ONBOARDER_EMAIL = "MARRAINAGE_REJECT_ONBOARDER_EMAIL",
    MARRAINAGE_REQUEST_FAILED = "MARRAINAGE_REQUEST_FAILED",
    ONBOARDING_REFERENT_EMAIL = "ONBOARDING_REFERENT_EMAIL",
    EMAIL_CREATED_EMAIL = "EMAIL_CREATED_EMAIL",
    EMAIL_MATTERMOST_ACCOUNT_CREATED = "EMAIL_MATTERMOST_ACCOUNT_CREATED",
    EMAIL_PR_PENDING = "EMAIL_PR_PENDING",
    EMAIL_PR_PENDING_TO_TEAM = "EMAIL_PR_PENDING_TO_TEAM",
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
}

export type SubjectFunction = {
    (variables: EmailProps["variables"]): string;
};

export type HtmlBuilderType = {
    renderFile(url: string, params: any): Promise<string>;
    templates: Record<EmailProps["type"], string | null>;
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

export type EmailMarrainageOnboarder = {
    type: EMAIL_TYPES.MARRAINAGE_ONBOARDER_EMAIL;
    variables: {
        member: memberBaseInfoSchemaType;
        newcomers: {
            fullname: string;
            email: string;
            secondary_email: string;
        }[];
    };
};

export type EmailMarrainageNewcomer = {
    type: EMAIL_TYPES.MARRAINAGE_NEWCOMER_EMAIL;
    variables: {
        member: memberBaseInfoSchemaType;
        onboarder: {
            fullname: string;
        };
    };
};

export type MarrainageRequestEmail = {
    type: EMAIL_TYPES.MARRAINAGE_REQUEST_EMAIL;
    variables: {
        newcomer: memberBaseInfoSchemaType;
        onboarder: memberBaseInfoSchemaType;
        marrainageAcceptUrl: string;
        marrainageDeclineUrl: string;
        startup: string;
    };
};

export type LoginEmail = {
    type: EMAIL_TYPES.LOGIN_EMAIL;
    variables: {
        loginUrlWithToken: string;
    };
};

export type MarrainageAcceptNewcomerEmail = {
    type: EMAIL_TYPES.MARRAINAGE_ACCEPT_NEWCOMER_EMAIL;
    variables: {
        newcomer: memberBaseInfoSchemaType;
        onboarder: memberBaseInfoSchemaType;
    };
};

export type MarrainageAcceptOnboarderEmail = {
    type: EMAIL_TYPES.MARRAINAGE_ACCEPT_ONBOARDER_EMAIL;
    variables: {
        newcomer: memberBaseInfoSchemaType;
        onboarder: memberBaseInfoSchemaType;
    };
};

export type MarrainageRequestFailed = {
    type: EMAIL_TYPES.MARRAINAGE_REQUEST_FAILED;
    variables: {
        errorMessage: string;
        userId: string;
    };
};

export type EmailOnboardingReferent = {
    type: EMAIL_TYPES.ONBOARDING_REFERENT_EMAIL;
    variables: {
        referent: string;
        prUrl: string;
        name: string;
        isEmailBetaAsked: boolean;
        isSentViaEmail: boolean;
    };
};

export type EmailCreatedEmail = {
    type: EMAIL_TYPES.EMAIL_CREATED_EMAIL;
    variables: {
        email: string;
        secondaryEmail: string;
        secretariatUrl: string;
        mattermostInvitationLink: string;
    };
};

export type EmailMattermostAccountCreated = {
    type: EMAIL_TYPES.EMAIL_MATTERMOST_ACCOUNT_CREATED;
    variables: {
        resetPasswordLink: string;
    };
};

export type EmailPRPending = {
    type: EMAIL_TYPES.EMAIL_PR_PENDING;
    variables: {
        username: string;
        pr_link: string;
    };
};

export type EmailEndingContract = {
    type:
        | EMAIL_TYPES.EMAIL_ENDING_CONTRACT_30_DAYS
        | EMAIL_TYPES.EMAIL_ENDING_CONTRACT_15_DAYS
        | EMAIL_TYPES.EMAIL_ENDING_CONTRACT_2_DAYS;
    variables: {
        endDate: string;
        user: {
            userInfos: memberBaseInfoSchemaType;
            mattermostUsername: string;
        };
        jobs: Job[];
    };
};

export type EmailNoMoreContract = {
    type:
        | EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_1_DAY
        | EMAIL_TYPES.EMAIL_NO_MORE_CONTRACT_30_DAY;
    variables: {
        user: {
            userInfos: memberBaseInfoSchemaType;
            mattermostUsername: string;
        };
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
        phase:
            | StartupPhase.PHASE_ACCELERATION
            | StartupPhase.PHASE_CONSTRUCTION
            | StartupPhase.PHASE_INVESTIGATION;
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

export type EmailPRPendingToTeam = {
    type: EMAIL_TYPES.EMAIL_PR_PENDING_TO_TEAM;
    variables: {
        username: string;
        pr_link: string;
        startup: string;
    };
};

export type EmailVerificationWaiting = {
    type: EMAIL_TYPES.EMAIL_VERIFICATION_WAITING;
    variables: {
        secondaryEmail: string;
        secretariatUrl: string;
    };
};

export type EmailNewMemberValidation = {
    type: EMAIL_TYPES.EMAIL_NEW_MEMBER_VALIDATION;
    variables: {
        userInfos: memberPublicInfoSchemaType;
        startup: string;
    };
};

export type EmailVariants =
    | EmailMarrainageNewcomer
    | EmailMarrainageOnboarder
    | LoginEmail
    | MarrainageRequestEmail
    | MarrainageAcceptNewcomerEmail
    | MarrainageAcceptOnboarderEmail
    | MarrainageRequestFailed
    | EmailOnboardingReferent
    | EmailCreatedEmail
    | EmailMattermostAccountCreated
    | EmailPRPending
    | EmailEndingContract
    | EmailNoMoreContract
    | EmailUserShouldUpdateInfo
    | EmailNewsletter
    | EmailNewMemberPR
    | EmailStartupEnterConstructionPhase
    | EmailStartupEnterAccelerationPhase
    | EmailStartupEnterInvestigationPhase
    | EmailStartupAskPhase
    | EmailForumReminder
    | EmailTest
    | EmailPRPendingToTeam
    | EmailVerificationWaiting
    | EmailNewMemberValidation;

export type EmailProps = BaseEmail & EmailVariants;

export type SendEmailProps = {
    subject?: string;
    type: EmailProps["type"];
    variables: EmailProps["variables"];
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
    props: SendCampaignEmailProps
) => Promise<null>;

export type AddContactsToMailingLists = (
    props: AddContactsToMailingListsProps
) => Promise<null>;

export type UpdateContactEmail = (
    props: UpdateContactEmailProps
) => Promise<null>;

export type RemoveContactsFromMailingList = (
    props: RemoveContactsFromMailingListProps
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
