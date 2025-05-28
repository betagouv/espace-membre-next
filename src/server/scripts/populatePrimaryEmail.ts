import { db } from "@/lib/kysely";
import { Domaine } from "@/models/member";
import Betagouv from "@betagouv";
import { buildBetaEmail } from "@controllers/utils";

const populatePrimaryEmail = async () => {
  const allOvhEmails = await Betagouv.getAllEmailInfos();
  for (const emailId of allOvhEmails) {
    try {
      await db
        .insertInto("users")
        .values({
          username: emailId,
          role: "",
          fullname: emailId,
          domaine: Domaine.ANIMATION,
          primary_email: buildBetaEmail(emailId),
        })
        .execute();
      console.log("Add ", emailId);
    } catch (e) {
      // error
    }
  }
};

populatePrimaryEmail();
