"use server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { db } from "@/lib/kysely";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { memberBaseInfoToModel } from "@/models/mapper";
import { EmailStatusCode } from "@/models/member";
import { isSessionUserIncubatorTeamAdminForUser } from "@/server/config/admin.config";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    BusinessError,
    withErrorHandling,
} from "@/utils/error";

const validateNewMemberSchema = z.object({
    memberUuid: z.string().uuid(),
});
type validateNewMemberSchemaType = z.infer<typeof validateNewMemberSchema>;

async function validateNewMember({
    memberUuid,
}: validateNewMemberSchemaType): Promise<void> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const rawData = await getUserBasicInfo({ uuid: memberUuid });
    if (!rawData) {
        throw new BusinessError(
            "userNotFound",
            `No user found for id : ${memberUuid}`
        );
    }
    const newMember = memberBaseInfoToModel(rawData);
    const sessionUserIsFromIncubatorTeam =
        !!session.user.isAdmin ||
        (await isSessionUserIncubatorTeamAdminForUser({
            user: newMember,
            sessionUserUuid: session.user.uuid,
        }));
    if (!sessionUserIsFromIncubatorTeam) {
        throw new AuthorizationError();
    }

    // todo check that it is authorized
    await db
        .updateTable("users")
        .where("uuid", "=", memberUuid)
        .set({
            primary_email_status: EmailStatusCode.EMAIL_VERIFICATION_WAITING,
        })
        .execute();
}

export const safeValidateNewMember = withErrorHandling(validateNewMember);
