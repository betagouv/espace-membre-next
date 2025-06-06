import {
  AddContactsToMailingListsProps,
  SendCampaignEmailProps,
  SendEmailProps,
  RemoveContactsFromMailingListProps,
  UpdateContactEmailProps,
  Contact,
} from "@modules/email";

const sentEmails: Array<SendEmailProps> = []; // For testing purposes only
const sentCampaignEmails: Array<SendCampaignEmailProps> = []; // For testing purposes only

function fakeUnblacklistContactEmail(props: { email: string }): Promise<void> {
  return Promise.resolve();
}

function fakeSendEmail(props: SendEmailProps): Promise<null> {
  if (process.env.NODE_ENV === "test") {
    // Register the sent email but don't send it for real
    sentEmails.push(props);
    return Promise.resolve(null);
  }

  const { subject, toEmail, type, variables } = props;

  console.info(
    `EMAIL OUT: ${toEmail
      .map((item) => item)
      .join(", ")} with subject "${subject}" and type ${type}`,
    variables,
  );

  return Promise.resolve(null);
}

function fakeSendCampaignEmail(props: SendCampaignEmailProps): Promise<null> {
  if (process.env.NODE_ENV === "test") {
    // Register the sent email but don't send it for real
    sentCampaignEmails.push(props);
    return Promise.resolve(null);
  }

  const { subject, type, variables } = props;

  console.info(
    `EMAIL OUT: ${type} with subject "${subject}" and type ${type}`,
    variables,
  );

  return Promise.resolve(null);
}

function fakeAddContactsToMailingLists(
  props: AddContactsToMailingListsProps,
): Promise<null> {
  return Promise.resolve(null);
}

function fakeRemoveContactsFromMailingList(
  props: RemoveContactsFromMailingListProps,
): Promise<null> {
  return Promise.resolve(null);
}

function fakeUpdateContactEmail(props: UpdateContactEmailProps): Promise<null> {
  return Promise.resolve(null);
}

function fakeGetAllTransacBlockedContacts(props: {
  startDate: Date;
  endDate: Date;
  offset: number;
  senders?: string[];
}): Promise<Contact[]> {
  return Promise.resolve([]);
}

function fakeSmtpBlockedContactsEmailDelete(props: {
  email: string;
}): Promise<null> {
  return Promise.resolve(null);
}

function fakeGetAllContacts(props: {}): Promise<Contact[]> {
  return Promise.resolve([]);
}

function fakeGetAllContactsFromList(props: {
  listId: number;
}): Promise<Contact[]> {
  return Promise.resolve([]);
}

function fakeGetContactInfo(props: { email: string }): Promise<Contact> {
  return Promise.resolve({
    email: "aneamil@gmail.com",
  });
}

// For tests only
const getSentEmails = () => {
  return sentEmails;
};

const resetSentEmails = () => {
  while (sentEmails.length) {
    sentEmails.pop();
  }
};

export {
  getSentEmails,
  fakeSendEmail,
  resetSentEmails,
  fakeSendCampaignEmail,
  fakeAddContactsToMailingLists,
  fakeRemoveContactsFromMailingList,
  fakeUpdateContactEmail,
  fakeGetAllTransacBlockedContacts,
  fakeSmtpBlockedContactsEmailDelete,
  fakeGetAllContacts,
  fakeGetAllContactsFromList,
  fakeUnblacklistContactEmail,
  fakeGetContactInfo,
};
