import { db } from "./kysely";
import * as hstore from "@/lib/hstore";
import {
    BaseEventAction,
    EventAction,
    EventActionFromDB,
    EventCode,
} from "@/models/actionEvent";

export async function addEvent(event: EventAction) {
    return db
        .insertInto("events")
        .values({
            ...event,
            action_metadata: event["action_metadata"]
                ? hstore.stringify(event["action_metadata"])
                : undefined,
        })
        .execute();
}

export async function addActionEvent<T extends EventCode>(
    event: BaseEventAction<T>
) {
    return db
        .insertInto("events")
        .values({
            ...event,
            action_metadata: event["action_metadata"]
                ? hstore.stringify(event["action_metadata"])
                : undefined,
        })
        .execute();
}

export async function getEventListByUsername(username: string) {
    const eventList = await db
        .selectFrom("events")
        .selectAll()
        .where("action_on_username", "=", username)
        .orderBy("created_at desc")
        .execute();
    return eventList.map((event) => ({
        ...event,
        action_metadata: event.action_metadata
            ? hstore.parse(event.action_metadata)
            : {},
    }));
}
