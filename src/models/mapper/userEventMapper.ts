import { Selectable } from "kysely";

import { userEventSchema, userEventSchemaType } from "../userEvent";
import { UserEvents } from "@/@types/db";

export function mapToUserEvent(
    event: Selectable<UserEvents>
): userEventSchemaType {
    return userEventSchema.parse({
        uuid: event.uuid,
        field_id: event.field_id,
        date: event.date,
        user_id: event.user_id,
        created_at: event.created_at ? new Date(event.created_at) : undefined,
        updated_at: event.updated_at ? new Date(event.updated_at) : undefined,
    });
}
