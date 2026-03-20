import config from "@/server/config";
import {
  getAllContactsFromList,
  getAllTransacBlockedContacts,
  unblacklistContactEmail,
} from "@/server/config/email.config";
import { db } from "@/lib/kysely";

// get all brevo contacts blocked in MAILING_LIST_NEWSLETTER
// unblock them
export async function unblockEmailsThatAreActive() {
  const startDate = new Date();
  const endDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  let contacts = await getAllContactsFromList({
    listId: config.MAILING_LIST_NEWSLETTER,
  }); // SIB newsletter mailing list
  contacts = contacts.filter((c) => c.emailBlacklisted);
  console.log("Blacklisted contacts", contacts);
  const transacContacts = await getAllTransacBlockedContacts({
    startDate,
    endDate,
    senders: [
      "espace-membre@beta.gouv.fr",
      "espace-membre@incubateur.net",
      "contact@beta.gouv.fr",
    ],
    offset: 0,
  });
  // Use DIMAIL active mailbox emails instead of OVH
  const dimailRows = await db
    .selectFrom("dinum_emails")
    .select("email")
    .where("type", "=", "mailbox")
    .execute();
  const activeEmails = dimailRows.map((e) => e.email);
  const contactEmails = [...transacContacts, ...contacts].map(
    (contact) => contact.email,
  );
  const emailsToBeUnblocked = contactEmails.filter((email) =>
    activeEmails.includes(email),
  );
  console.log(`Email to unblocked`, JSON.stringify(emailsToBeUnblocked));
  for (const email of emailsToBeUnblocked) {
    if (
      process.env.FEATURE_UNBLOCK_CONTACT_EMAIL ||
      process.env.NODE_ENV === "test"
    ) {
      await unblacklistContactEmail({ email });
    }
  }
}
