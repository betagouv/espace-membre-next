"use server";
import { getServerSession } from "next-auth/next";

import {
    smtpBlockedContactsEmailDelete,
    unblacklistContactEmail,
} from "@/server/config/email.config";
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

export async function unblockMemberEmailAddressFromCampaign(email: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id || !session.user.isAdmin) {
        throw new AuthorizationError();
    }

    const res = await unblacklistContactEmail({
        email,
    });

    return res;
}
