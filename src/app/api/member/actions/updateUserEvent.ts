"use server";

import { getServerSession } from "next-auth/next";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    BusinessError,
    UnwrapPromise,
    withErrorHandling,
} from "@/utils/error";

export async function updateUserEvent({
    user_id,
    field_id,
    value,
    date,
}: {
    user_id: string;
    field_id: string;
    value: boolean;
    date?: Date;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const isCurrentUser = session.user.uuid === user_id;
    if (!isCurrentUser && !session.user.isAdmin) {
        throw new AuthorizationError();
    }
    const user = await getUserInfos({ uuid: user_id });
    if (!user) {
        throw new BusinessError("UserNotDefined", "User does not exist");
    }
    const eventDate = date || new Date();
    if (!value) {
        await db
            .deleteFrom("user_events")
            .where("field_id", "=", field_id)
            .where("user_id", "=", user_id)
            .execute();
    } else {
        await db
            .insertInto("user_events")
            .values({
                field_id,
                user_id,
                date: eventDate,
            })
            .onConflict((oc) => {
                return oc.column("field_id").column("user_id").doUpdateSet({
                    date: eventDate,
                });
            })
            .execute();
    }
    await addEvent({
        action_code: EventCode.MEMBER_USER_EVENTS_UPDATED,
        created_by_username: session.user.id,
        action_on_username: user.username,
        action_metadata: {
            field_id,
            value,
            date: !!value ? eventDate : null,
        },
    });
}

export const safeUpdateUserEvent = withErrorHandling<
    UnwrapPromise<ReturnType<typeof updateUserEvent>>,
    Parameters<typeof updateUserEvent>
>(updateUserEvent);
