import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { createMission } from "@/lib/kysely/queries/missions";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { createMemberSchema } from "@/models/actions/member";
import { EmailStatusCode } from "@/models/member";
import { isPublicServiceEmail, isAdminEmail } from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import {
    AdminEmailNotAllowedError,
    AuthorizationError,
    MemberUniqueConstraintViolationError,
    withHttpErrorHandling,
} from "@/utils/error";
import { createUsername } from "@/utils/github";

export const POST = withHttpErrorHandling(async (req: Request) => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const rawdata = await req.json();
    const { member, missions } = createMemberSchema.parse(rawdata);
    const hasPublicServiceEmail = await isPublicServiceEmail(member.email);
    if (hasPublicServiceEmail && !isAdminEmail(member.email)) {
        throw new AdminEmailNotAllowedError();
    }
    const username = createUsername(member.firstname, member.lastname);
    let dbUser;
    try {
        dbUser = await db
            .transaction()
            .execute(async (trx) => {
                const user = await trx
                    .insertInto("users")
                    .values({
                        domaine: member.domaine,
                        secondary_email: member.email,
                        fullname: `${member.firstname} ${member.lastname}`,
                        username,
                        role: "",
                        primary_email_status:
                            EmailStatusCode.EMAIL_VERIFICATION_WAITING,
                    })
                    .returning("uuid")
                    .executeTakeFirstOrThrow();
                for (const mission of missions) {
                    // Now, use the same transaction to link to an organization
                    await createMission(
                        {
                            ...mission,
                            user_id: user.uuid,
                        },
                        trx
                    );
                }
                return user;
            })
            .then(async (res) => {
                const dbUser = await getUserInfos({
                    uuid: res.uuid,
                    options: { withDetails: true },
                });
                revalidatePath("/community", "layout");
                return dbUser;
            });
    } catch (error: any) {
        if (
            error.message.includes(
                "duplicate key value violates unique constraint"
            )
        ) {
            // Handle unique constraint violation
            throw new MemberUniqueConstraintViolationError(username);
        }
        // Handle other potential errors (logging, rethrowing, etc.)
        console.error("Unexpected error:", error);
        throw error;
    }
    return Response.json(dbUser);
});
