import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { updateMember } from "../../updateMember";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { memberInfoUpdateSchema } from "@/models/actions/member";
import { authOptions } from "@/utils/authoptions";
import { withHttpErrorHandling } from "@/utils/error";

async function memberInfoUpdateHandler(
    req,
    { params: { username } }: { params: { username: string } },
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.id !== username && !session.user.isAdmin)) {
        return NextResponse.json(
            { message: "You don't have the right to access this function" },
            { status: 403 },
        );
    }
    const rawdata = await req.json();
    const memberData = memberInfoUpdateSchema.shape.member.parse(rawdata);
    const previousInfo = await getUserInfos({ username });
    if (!previousInfo) {
        return NextResponse.json(
            { message: "User does not exist" },
            { status: 404 },
        );
    }

    await updateMember(
        memberData,
        previousInfo.uuid,
        undefined,
        session.user.id,
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

export const PUT = withHttpErrorHandling(memberInfoUpdateHandler);
