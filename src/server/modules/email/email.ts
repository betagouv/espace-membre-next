// import { DBUser, DBUserWithEmailsAndMattermostUsername } from "@/models/dbUser";
import { StartupsPhaseEnum } from "@/@types/db";
import { incubatorSchemaType } from "@/models/incubator";
import { Job } from "@/models/job";
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
    MARRAINAGE_NEWCOMER_EMAIL = "MARRAINAGE_NEWCOMER_EMAIL",
    MARRAINAGE_ONBOARDER_EMAIL = "MARRAINAGE_ONBOARDER_EMAIL",
    EMAIL_LOGIN = "EMAIL_LOGIN",
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
    EMAIL_TEAM_COMPOSITION = "EMAIL_TEAM_COMPOSITION",
    EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS = "EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS",
    EMAIL_STARTUP_NEW_MEMBER_ARRIVAL = "EMAIL_STARTUP_NEW_MEMBER_ARRIVAL",
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

export type EmailLogin = {
    type: EMAIL_TYPES.EMAIL_LOGIN;
    variables: {
        loginUrlWithToken: string;
        fullname: string;
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
        emailUrl: string;
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
        user: memberBaseInfoSchemaType;
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

export type EmailVariants =
    | EmailMarrainageNewcomer
    | EmailMarrainageOnboarder
    | EmailLogin
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
    | EmailStartupNewMemberArrival
    | EmailStartupAskPhase
    | EmailForumReminder
    | EmailTest
    | EmailPRPendingToTeam
    | EmailVerificationWaiting
    | EmailNewMemberValidation
    | EmailTeamComposition
    | EmailStartupMembersDidNotChangeInXMonths;

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
