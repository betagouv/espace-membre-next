import {
  fakeAddContactsToMailingLists,
  fakeGetAllTransacBlockedContacts,
  fakeRemoveContactsFromMailingList,
  fakeSendCampaignEmail,
  fakeSendEmail,
  fakeGetAllContacts,
  fakeGetAllContactsFromList,
  fakeUnblacklistContactEmail,
  fakeGetContactInfo,
  fakeUpdateContactEmail,
  fakeSmtpBlockedContactsEmailDelete,
} from "@infra/email";
import { makeSendinblue } from "@infra/email/sendInBlue";
import {
  AddContactsToMailingLists,
  GetAllContacts,
  GetAllContactsFromList,
  GetAllTransacBlockedContacts,
  IMailingService,
  RemoveContactsFromMailingList,
  SendCampaignEmail,
  SendEmail,
  SmtpBlockedContactsEmailDelete,
  UpdateContactEmail,
  UnblacklistContactEmail,
  GetContactInfo,
} from "@modules/email";
import htmlBuilder from "@modules/htmlbuilder/htmlbuilder";

let sendEmail: SendEmail = fakeSendEmail;
let addContactsToMailingLists: AddContactsToMailingLists =
  fakeAddContactsToMailingLists;
let removeContactsFromMailingList: RemoveContactsFromMailingList =
  fakeRemoveContactsFromMailingList;
let sendCampaignEmail: SendCampaignEmail = fakeSendCampaignEmail;
let updateContactEmail: UpdateContactEmail = fakeUpdateContactEmail;
let smtpBlockedContactsEmailDelete: SmtpBlockedContactsEmailDelete =
  fakeSmtpBlockedContactsEmailDelete;
let getAllTransacBlockedContacts: GetAllTransacBlockedContacts =
  fakeGetAllTransacBlockedContacts;
let getAllContacts: GetAllContacts = fakeGetAllContacts;
let getAllContactsFromList: GetAllContactsFromList = fakeGetAllContactsFromList;
let unblacklistContactEmail: UnblacklistContactEmail =
  fakeUnblacklistContactEmail;
let getContactInfo: GetContactInfo = fakeGetContactInfo;

export const EMAIL_CONFIG = {
  MAIL_SENDER: process.env.MAIL_SENDER || "espace-membre@incubateur.net",
  SIB_APIKEY_PUBLIC: process.env.SIB_APIKEY_PUBLIC!,
  SIB_APIKEY_PRIVATE: process.env.SIB_APIKEY_PRIVATE!,
};

const {
  MAIL_SENDER,
  SIB_APIKEY_PUBLIC,
  SIB_APIKEY_PRIVATE,
} = EMAIL_CONFIG;

if (process.env.NODE_ENV !== "test") {
  try {
    const sendInBlue = makeSendinblue({
      MAIL_SENDER,
      SIB_APIKEY_PUBLIC,
      SIB_APIKEY_PRIVATE,
      htmlBuilder,
    });
    console.log("Emails will be sent using Sendinblue");
    sendEmail = sendInBlue.sendEmail;
    if (process.env.NODE_ENV === "production") {
      // in dev we still use fakeEmailService
      sendCampaignEmail = sendInBlue.sendCampaignEmail;
      addContactsToMailingLists = sendInBlue.addContactsToMailingLists;
      removeContactsFromMailingList = sendInBlue.removeContactsFromMailingList;
      updateContactEmail = sendInBlue.updateContactEmail;
      smtpBlockedContactsEmailDelete =
        sendInBlue.smtpBlockedContactsEmailDelete;
      getAllTransacBlockedContacts = sendInBlue.getAllTransacBlockedContacts;
      getAllContacts = sendInBlue.getAllContacts;
      getAllContactsFromList = sendInBlue.getAllContactsFromList;
      unblacklistContactEmail = sendInBlue.unblacklistContactEmail;
      getContactInfo = sendInBlue.getContactInfo;
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
} else {
  console.log("Emails will go through a FAKE email service (no mails sent).");
}

export {
  sendEmail,
  addContactsToMailingLists,
  sendCampaignEmail,
  removeContactsFromMailingList,
  updateContactEmail,
  smtpBlockedContactsEmailDelete,
  getAllTransacBlockedContacts,
  getAllContacts,
  getAllContactsFromList,
  unblacklistContactEmail,
  getContactInfo,
};
