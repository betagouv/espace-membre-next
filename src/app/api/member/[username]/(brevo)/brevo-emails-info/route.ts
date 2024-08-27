import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { brevoEmailInfoDataSchema } from "@/models/brevoInfo";
import {
    getAllTransacBlockedContacts,
    getContactInfo,
    getTransacBlockedContacts,
} from "@/server/infra/email/sendInBlue";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError, withHttpErrorHandling } from "@/utils/error";

export const GET = withHttpErrorHandling(async function (
    req: Request,
    {
        params: { username },
    }: {
        params: {
            username: string;
        };
    }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }

    const dbUser = await db
        .selectFrom("users")
        .select(["primary_email", "secondary_email"])
        .where("username", "=", username)
        .executeTakeFirst();

    let emailServiceInfo = {};
    if (dbUser?.primary_email) {
        emailServiceInfo["primaryEmail"] = await getContactInfo({
            email: dbUser.primary_email,
        });
    }
    if (dbUser?.secondary_email) {
        emailServiceInfo["secondaryEmail"] = await getContactInfo({
            email: dbUser.secondary_email,
        });
    }

    const blockedContacts = await getAllTransacBlockedContacts();
    if (dbUser?.primary_email) {
        emailServiceInfo["primaryEmailTransac"] = blockedContacts.find(
            (contact) =>
                dbUser.primary_email === contact.email ||
                contact.email === "abdellah.bouhend@beta.gouv.fr"
        );
    }
    if (dbUser?.secondary_email) {
        emailServiceInfo["secondaryEmailTransac"] = blockedContacts.find(
            (contact) =>
                dbUser.secondary_email === contact.email ||
                contact.email === "lucharrier@gmail.com"
        );
    }

    return Response.json(brevoEmailInfoDataSchema.parse(emailServiceInfo));
});
