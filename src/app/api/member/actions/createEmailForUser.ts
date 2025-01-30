"use server";

import { getServerSession } from "next-auth/next";

import { createEmailForUser } from "@/server/controllers/usersController/createEmailForUser";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    UnwrapPromise,
    withErrorHandling,
} from "@/utils/error";

export async function createEmail({
    username,
    to_email,
}: {
    username: string;
    to_email?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }

    await createEmailForUser({ username }, session.user.id);
}

export const safeCreateEmail = withErrorHandling<
    UnwrapPromise<ReturnType<typeof createEmail>>,
    Parameters<typeof createEmail>
>(createEmail);
