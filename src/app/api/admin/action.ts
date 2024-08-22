"use server";
import { getServerSession } from "next-auth/next";

import { smtpBlockedContactsEmailDelete } from "@/server/config/email.config";
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError } from "@/utils/error";

export async function unblockMemberEmailAddress(email: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id || !session.user.isAdmin) {
        throw new AuthorizationError();
    }
    const res = await smtpBlockedContactsEmailDelete({
        email,
    });
    return res;
}
