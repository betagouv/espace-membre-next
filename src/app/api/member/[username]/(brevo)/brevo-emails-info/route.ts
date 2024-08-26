import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { brevoEmailInfoDataSchema } from "@/models/brevoInfo";
import { getContactInfo } from "@/server/infra/email/sendInBlue";
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
    return Response.json(brevoEmailInfoDataSchema.parse(emailServiceInfo));
});
