import { db } from "@/lib/kysely";
import { EmailStatusCode } from "@/models/member";
import config from "@/server/config";
import {
  getAllContactsFromList,
  getAllTransacBlockedContacts,
  unblacklistContactEmail,
} from "@/server/config/email.config";

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
  const activeUsers = await db
    .selectFrom("users")
    .select("primary_email")
    .where("primary_email_status", "=", EmailStatusCode.EMAIL_ACTIVE)
    .where("primary_email", "is not", null)
    .execute();
  const activeEmails = activeUsers
    .map((u) => u.primary_email)
    .filter(Boolean) as string[];
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
