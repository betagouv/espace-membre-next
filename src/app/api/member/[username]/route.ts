import * as Sentry from "@sentry/node";
import { getServerSession } from "next-auth";

import { updateMember } from "../updateMember";
import {
    getUserBasicInfo,
    getUserInfos,
    updateUser,
} from "@/lib/kysely/queries/users";
import { MattermostUser, getUserByEmail, searchUsers } from "@/lib/mattermost";
import {
    memberInfoUpdateSchemaType,
    memberInfoUpdateSchema,
    memberValidateInfoSchema,
} from "@/models/actions/member";
import { EmailStatusCode } from "@/models/member";
import betagouv from "@/server/betagouv";
import config from "@/server/config";
import {
    isPublicServiceEmail,
    isAdminEmail,
    userInfos,
} from "@/server/controllers/utils";
import { authOptions } from "@/utils/authoptions";
import { AdminEmailNotAllowedError } from "@/utils/error";

export async function PUT(
    req: Request,
    { params: { username } }: { params: { username: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.id !== username) {
        throw new Error(`You don't have the right to access this function`);
    }
    const memberData = memberValidateInfoSchema.parse(await req.json());

    const hasPublicServiceEmail = await isPublicServiceEmail(
        memberData.secondary_email
    );
    if (hasPublicServiceEmail && isAdminEmail(memberData.secondary_email)) {
        throw new AdminEmailNotAllowedError();
    }
    updateMember(
        memberData,
        session.user.uuid,
        {
            primary_email: hasPublicServiceEmail
                ? memberData.secondary_email
                : null,
            secondary_email: hasPublicServiceEmail
                ? null
                : memberData.secondary_email,
            primary_email_status: hasPublicServiceEmail
                ? EmailStatusCode.EMAIL_ACTIVE
                : EmailStatusCode.EMAIL_CREATION_WAITING,
        },
        session.user.id
    );

    const dbUser = await getUserInfos({
        username,
        options: { withDetails: true },
    });

    return Response.json({
        message: `Success`,
        data: dbUser,
    });
}
