import SibApiV3Sdk from "sib-api-v3-sdk";

import config from "@/server/config";
import { BusinessError } from "@/utils/error";
import { objectArrayToCSV } from "@controllers/utils";
import {
  EmailProps,
  SendEmail,
  SendEmailProps,
  AddContactsToMailingListsProps,
  MAILING_LIST_TYPE,
  SendCampaignEmailProps,
  IMailingService,
  SendCampaignEmail,
  RemoveContactsFromMailingListProps,
  UpdateContactEmailProps,
  Contact,
  EmailVariants,
  EMAIL_TYPES,
} from "@modules/email";

const TEMPLATE_ID_BY_TYPE: Record<EmailProps["type"], number> = {
  EMAIL_LOGIN: 0,
  EMAIL_CREATED_EMAIL: 0,
  EMAIL_MATTERMOST_ACCOUNT_CREATED: 0,
  EMAIL_ENDING_CONTRACT_2_DAYS: 0,
  EMAIL_ENDING_CONTRACT_15_DAYS: 0,
  EMAIL_ENDING_CONTRACT_30_DAYS: 0,
  EMAIL_NO_MORE_CONTRACT_1_DAY: 0,
  EMAIL_NO_MORE_CONTRACT_30_DAY: 0,
  EMAIL_USER_SHOULD_UPDATE_INFO: 0,
  EMAIL_NEWSLETTER: 0,
  EMAIL_NEW_MEMBER_PR: 7,
  EMAIL_STARTUP_ENTER_CONSTRUCTION_PHASE: 1,
  EMAIL_STARTUP_ENTER_ACCELERATION_PHASE: 3,
  EMAIL_STARTUP_ENTER_INVESTIGATION_PHASE: 2,
  EMAIL_STARTUP_ASK_PHASE: 15,
  EMAIL_FORUM_REMINDER: 16,
  EMAIL_TEST: 0,
  EMAIL_VERIFICATION_WAITING: 0,
  EMAIL_NEW_MEMBER_VALIDATION: 0,
  [EMAIL_TYPES.EMAIL_TEAM_COMPOSITION]: 0,
  [EMAIL_TYPES.EMAIL_STARTUP_MEMBERS_DID_NOT_CHANGE_IN_X_MONTHS]: 0,
  [EMAIL_TYPES.EMAIL_STARTUP_NEW_MEMBER_ARRIVAL]: 0,
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_CREATED]: 0,
  [EMAIL_TYPES.EMAIL_MATOMO_ACCOUNT_UPDATED]: 0,
  [EMAIL_TYPES.EMAIL_VERIFICATION_WAITING_RAISE]: 267,
  [EMAIL_TYPES.EMAIL_VALIDATION_WAITING_RAISE]: 0, // todo
};

type SendEmailFromSendinblueDeps = {
  SIB_APIKEY_PUBLIC?: string;
  SIB_APIKEY_PRIVATE: string;
  MAIL_SENDER: string;
  htmlBuilder:
    | {
        renderFile(url: string, params: any): Promise<string>;
        renderContentForType(params: EmailVariants): Promise<string>;
        renderSubjectForType(params: EmailVariants): string;
        templates: Record<EmailProps["type"], string | null | any>;
      }
    | undefined;
};

const MAILING_LIST_ID_BY_TYPE: Record<MAILING_LIST_TYPE, number> = {
  NEWSLETTER: config.MAILING_LIST_NEWSLETTER || 332,
  ONBOARDING: config.MAILING_LIST_ONBOARDING || 333,
  TEST: 336,
  FORUM_REMINDER: config.MAILING_LIST_REMINDER || 7,
};

type SendinblueDeps = {
  SIB_APIKEY_PUBLIC?: string;
  SIB_APIKEY_PRIVATE: string;
  MAIL_SENDER: string;
  htmlBuilder:
    | {
        renderFile(url: string, params: any): Promise<string>;
        renderContentForType(params: EmailVariants): Promise<string>;
        renderSubjectForType(params: EmailVariants): string;
        templates: Record<EmailProps["type"], string | null | any>;
      }
    | undefined;
};

export interface SIBContact {
  email: string;
  reason: {
    message: string;
    code:
      | "hardBounce"
      | "unsubscribedViaMA"
      | "unsubscribedViaEmail"
      | "adminBlocked"
      | "unsubscribedViaApi"
      | "contactFlaggedAsSpam";
  };
  blockedAt: Date;
}

export function createContact({
  email,
  listIds,
  attributes,
}: {
  email: string;
  listIds: number[];
  attributes?: {
    PRENOM: string;
    NOM: string;
  };
}) {
  let apiInstance = new SibApiV3Sdk.ContactsApi();
  let createContact = new SibApiV3Sdk.CreateContact();
  createContact.email = email;
  createContact.listIds = listIds;
  createContact.attributes = attributes;

  return apiInstance.createContact(createContact).then(
    function (data) {
      console.log(
        "API called successfully. Returned data: " + JSON.stringify(data),
      );
    },
    function (error) {
      console.error(`Cannot add ${email}`, email);
    },
  );
}

async function createEmailCampaign(props) {
  const {
    subject,
    sender,
    html,
    templateId,
    listIds,
    campaignName,
    variables,
  } = props;
  let apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
  let emailCampaigns = new SibApiV3Sdk.CreateEmailCampaign();
  emailCampaigns = {
    sender: sender,
    name: campaignName,
    params: variables,
    templateId,
    htmlContent: html,
    subject,
    recipients: { listIds: listIds },
  };
  return apiInstance.createEmailCampaign(emailCampaigns).then(
    function (data) {
      console.log(
        "API called successfully. Returned data: " + JSON.stringify(data),
      );
      return data;
    },
    function (error) {
      console.error(error);
    },
  );
}

export const makeSendCampaignEmail = ({
  MAIL_SENDER,
  htmlBuilder,
}: {
  MAIL_SENDER: SendEmailFromSendinblueDeps["MAIL_SENDER"];
  htmlBuilder: SendEmailFromSendinblueDeps["htmlBuilder"];
}): SendCampaignEmail => {
  return async function sendCampaignEmail(props: SendCampaignEmailProps) {
    const {
      subject,
      variables,
      htmlContent,
      campaignName,
      type,
      mailingListType,
      forceTemplate,
    } = props;

    let templateId: number | undefined;
    let html: string | undefined;
    if (htmlContent) {
      html = htmlContent;
      if (!html.includes(`unsubscribe`)) {
        // unsubscribe is mandatory
        html = `${html}<a href="{{ unsubscribe }}">Click here to unsubscribe</a>`;
      }
    } else {
      if (!htmlBuilder || forceTemplate) {
        templateId = TEMPLATE_ID_BY_TYPE[type];
        if (!templateId) {
          throw new BusinessError(
            "noCampaignBrevoTemplateExists",
            `Il n'y a pas de template email brevo de campagne pour : ${type}`,
          );
        }
      } else {
        const templateURL = htmlBuilder.templates[type];
        if (templateURL && typeof templateURL === "string") {
          html = await htmlBuilder.renderFile(templateURL, {
            ...variables,
          });
        } else {
          throw new BusinessError(
            "noCampaignTemplateExists",
            `Il n'y a pas de template email de campagne pour : ${type}`,
          );
        }
      }
    }

    const campaign = await createEmailCampaign({
      subject,
      variables,
      sender: {
        name: "Espace Membre BetaGouv",
        email: MAIL_SENDER,
      },
      html,
      templateId,
      listIds: [MAILING_LIST_ID_BY_TYPE[mailingListType]],
      campaignName,
    });
    let apiInstance = new SibApiV3Sdk.EmailCampaignsApi();

    let campaignId = campaign.id;

    return apiInstance.sendEmailCampaignNow(campaignId).then(
      function () {
        console.log("API called successfully.");
      },
      function (error) {
        console.error(error);
      },
    );
  };
};

export async function getAllContactsFromList({
  listId,
  opts,
}: {
  listId: number;
  opts?: { limit: number; offset: number };
}) {
  let apiInstance = new SibApiV3Sdk.ContactsApi();
  opts = opts || {
    limit: 500,
    offset: 0,
  };
  const data = await apiInstance
    .getContactsFromList(listId, opts)
    .then((data) => {
      return data.contacts;
    });
  if (data.length < 500) {
    return data;
  }
  const nextData = await getAllContactsFromList({
    listId,
    opts: {
      limit: 500,
      offset: opts.offset + 500,
    },
  });

  return [...data, ...nextData];
}

export async function importContactsToMailingLists({
  contacts,
  listTypes,
}: AddContactsToMailingListsProps): Promise<null> {
  let apiInstance = new SibApiV3Sdk.ContactsApi();

  let requestContactImport = new SibApiV3Sdk.RequestContactImport();
  let sibContacts = contacts.map((contact) => ({
    email: contact.email,
    NOM: contact.lastname,
    PRENOM: contact.firstname,
    DOMAINE: contact.domaine,
  }));
  requestContactImport.fileBody = objectArrayToCSV(sibContacts);
  const listIds = listTypes.map((id) => MAILING_LIST_ID_BY_TYPE[id]);
  console.log("SIB call : add email to list", listIds);
  requestContactImport.listIds = listIds;
  requestContactImport.emailBlacklist = false;
  requestContactImport.smsBlacklist = false;
  requestContactImport.updateExistingContacts = true;
  requestContactImport.emptyContactsAttributes = false;

  apiInstance.importContacts(requestContactImport).then(
    function (data) {
      console.log(
        "API called successfully. Returned data: " + JSON.stringify(data),
      );
    },
    function (error) {
      console.error(error);
    },
  );
  return null;
}

export async function getSendEventForUser(email: string) {
  let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  let opts = {
    email,
  };

  return apiInstance.getEmailEventReport(opts).then(
    function (data) {
      return data.events;
    },
    function (error) {
      console.error(error);
    },
  );
}

export async function smtpBlockedContactsEmailDelete({
  email,
}: {
  email: string;
}) {
  let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  console.log(`Unblocked email ${email}`);
  return apiInstance.smtpBlockedContactsEmailDelete(email).then(
    function () {
      console.log("API called successfully.");
    },
    function (error) {
      console.error(error);
    },
  );
}

export async function unblacklistContactEmail({
  email,
}: {
  email: string;
}): Promise<void> {
  let apiInstance = new SibApiV3Sdk.ContactsApi();

  let updateContact = new SibApiV3Sdk.UpdateContact();
  updateContact.emailBlacklisted = false;

  return apiInstance.updateContact(email, updateContact).then(
    function () {
      console.log("API called successfully.");
    },
    function (error) {
      console.error(error);
    },
  );
}

// export async function getAllTransacBlockedContacts({
//     startDate,
//     endDate,
//     offset,
//     senders,
// }: {
//     startDate: Date;
//     endDate: Date;
//     senders?: string[];
//     offset: number;
// }): Promise<Contact[]> {
//     const limit = 100;
//     let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
//     let opts = {
//         startDate: startDate.toISOString().split("T")[0], //mandatory
//         endDate: endDate.toISOString().split("T")[0], //mandatory
//         limit, // max 100
//         offset: offset || 0,
//         senders,
//     };

//     const data = await apiInstance
//         .getTransacBlockedContacts(opts)
//         .then((data) => {
//             return data.contacts;
//         });
//     if (data.length < limit) {
//         return data;
//     }
//     const nextData = await getAllTransacBlockedContacts({
//         startDate,
//         endDate,
//         senders,
//         offset: limit,
//     });
//     return [...data, ...nextData];
// }

export async function getAllContacts({
  offset,
}: {
  offset?: number;
  modifiedSince?: Date;
}): Promise<Contact[]> {
  const limit = 1000;
  let apiInstance = new SibApiV3Sdk.ContactsApi();
  let modifiedSince = new Date();
  modifiedSince.setMonth(modifiedSince.getMonth() - 3);
  let opts = {
    limit, // max 100
    offset: offset || 0,
    modifiedSince,
  };

  const data = await apiInstance.getContacts(opts).then((data) => {
    return data.contacts;
  });
  if (data.length < limit) {
    return data;
  }
  const nextData = await getAllContacts({
    offset: limit,
    modifiedSince,
  });
  return [...data, ...nextData];
}

export async function updateContactEmail({
  previousEmail,
  newEmail,
}: UpdateContactEmailProps) {
  let apiInstance = new SibApiV3Sdk.ContactsApi();

  let updateContact = new SibApiV3Sdk.UpdateContact();

  updateContact.attributes = { EMAIL: newEmail };

  return apiInstance.updateContact(previousEmail, updateContact).then(
    function () {
      console.log("API called successfully.");
    },
    function (error) {
      console.error(error);
    },
  );
}

export async function removeContactsFromMailingList({
  emails,
  listType,
}: RemoveContactsFromMailingListProps) {
  let apiInstance = new SibApiV3Sdk.ContactsApi();

  let listId = MAILING_LIST_ID_BY_TYPE[listType];

  let contactEmails = new SibApiV3Sdk.RemoveContactFromList();

  contactEmails.emails = emails;

  return apiInstance.removeContactFromList(listId, contactEmails).then(
    function (data) {
      console.log(
        "API called successfully. Returned data: " + JSON.stringify(data),
      );
    },
    function (error) {
      console.error(error);
    },
  );
}

export async function getContactInfo({ email }: { email: string }) {
  let apiInstance = new SibApiV3Sdk.ContactsApi();

  const data = apiInstance.getContactInfo(email).then(
    function (data) {
      return data;
    },
    function (error) {
      // console.error(error);
    },
  );
  return data;
}

export async function getTransacBlockedContacts({
  startDate,
  endDate,
  limit,
  offset,
  senders,
}: {
  startDate?: Date;
  endDate?: Date;
  limit: number;
  offset?: number;
  senders?: string[];
}): Promise<{
  contacts: SIBContact[];
  count: number;
}> {
  let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  let opts = {
    startDate,
    endDate,
    limit,
    offset,
    senders,
  };

  return apiInstance.getTransacBlockedContacts(opts).then(function (data) {
    return data;
  });
}

export async function getAllTransacBlockedContacts(
  params: {
    startDate?: Date;
    endDate?: Date;
    senders?: string[];
  } = {},
): Promise<SIBContact[]> {
  const limit = 100;

  async function fetchContacts(offset: number = 0): Promise<SIBContact[]> {
    const res = await getTransacBlockedContacts({
      ...params,
      offset,
      limit,
    });

    // Log the current offset for debugging
    if (res.contacts.length < limit) {
      return res.contacts;
    } else {
      // Recursively fetch the next batch and concatenate it with the current batch
      const nextContacts = await fetchContacts(offset + limit);
      return [...res.contacts, ...nextContacts];
    }
  }

  return fetchContacts();
}

export async function addContactsToMailingLists({
  contacts,
  listTypes,
}: AddContactsToMailingListsProps): Promise<null> {
  return importContactsToMailingLists({ contacts, listTypes });
}

export const makeSendEmail = ({
  MAIL_SENDER,
  htmlBuilder,
}: {
  MAIL_SENDER: SendEmailFromSendinblueDeps["MAIL_SENDER"];
  htmlBuilder: SendEmailFromSendinblueDeps["htmlBuilder"];
}): SendEmail => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  return async function sendEmailFromSendinblue(
    props: SendEmailProps,
  ): Promise<null> {
    const {
      type,
      toEmail,
      variables = {},
      replyTo,
      bcc,
      htmlContent,
      forceTemplate,
    } = props;

    let templateId: number | undefined;
    let html: string | undefined;
    let subject;
    console.log(`Will send email from SIB : ${forceTemplate}`);
    if (htmlContent) {
      html = htmlContent;
    } else {
      if (!htmlBuilder || forceTemplate) {
        templateId = TEMPLATE_ID_BY_TYPE[type];
        if (!templateId) {
          return Promise.reject(
            new Error("Cannot find template for type " + type),
          );
        }
      } else {
        const paramsToRenderContent = {
          variables,
          type,
        } as EmailVariants;
        // const templateURL = htmlBuilder.templates[type]
        html = await htmlBuilder.renderContentForType(paramsToRenderContent);
        subject =
          props.subject ||
          htmlBuilder.renderSubjectForType(paramsToRenderContent);
      }
    }
    const transacParams = {
      sender: {
        name: "Espace Membre BetaGouv",
        email: MAIL_SENDER,
      },
      to: toEmail.map((email) => ({
        email: email,
      })),
      params: variables,
      templateId,
      htmlContent: html,
      replyTo,
      subject: subject,
    };

    if (bcc) {
      transacParams["bcc"] = bcc.map((email) => ({
        email: email,
      }));
    }

    return apiInstance.sendTransacEmail({
      ...transacParams,
    });
  };
};

export const makeSendinblue = (deps: SendinblueDeps): IMailingService => {
  const { SIB_APIKEY_PRIVATE, htmlBuilder, MAIL_SENDER } = deps;

  const defaultClient = SibApiV3Sdk.ApiClient.instance;

  // Configure API key authorization: api-key
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = SIB_APIKEY_PRIVATE;
  // Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
  //apiKey.apiKeyPrefix['api-key'] = "Token"

  // Configure API key authorization: partner-key
  const partnerKey = defaultClient.authentications["partner-key"];
  partnerKey.apiKey = SIB_APIKEY_PRIVATE;

  return {
    sendEmail: makeSendEmail({ MAIL_SENDER, htmlBuilder }),
    sendCampaignEmail: makeSendCampaignEmail({ MAIL_SENDER, htmlBuilder }),
    addContactsToMailingLists,
    removeContactsFromMailingList,
    updateContactEmail,
    unblacklistContactEmail,
    smtpBlockedContactsEmailDelete,
    getAllTransacBlockedContacts,
    getContactInfo,
    getAllContacts,
    getAllContactsFromList,
  };
};
