"use server";

import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent";
import config from "@/server/config";
import { authOptions } from "@/utils/authoptions";

export async function changeSecondaryEmailForUser(
    secondary_email: string,
    username: string
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    if (
        !config.ESPACE_MEMBRE_ADMIN.includes(session.user.id) &&
        session.user.id != username
    ) {
        throw new Error(`You are not allowed to execute this function`);
    }
    const user = await db
        .selectFrom("users")
        .select("secondary_email")
        .where("username", "=", username)
        .executeTakeFirst();
    if (!user) {
        throw new Error("Users not found");
    }
    await db
        .updateTable("users")
        .set({
            secondary_email,
        })
        .where("username", "=", username)
        .execute();
    addEvent({
        action_code: EventCode.MEMBER_SECONDARY_EMAIL_UPDATED,
        created_by_username: session.user.id,
        action_on_username: username,
        action_metadata: {
            value: secondary_email,
            old_value: user.secondary_email || "",
        },
    });
}
