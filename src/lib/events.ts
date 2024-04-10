import * as hstore from "@/lib/hstore";
import {
    BaseEventAction,
    EventAction,
    EventActionFromDB,
    EventCode,
} from "@/models/actionEvent";
import knex from "@db";

export async function addEvent(event: EventAction): Promise<void> {
    return knex("events").insert({
        ...event,
        action_metadata: event["action_metadata"]
            ? hstore.stringify(event["action_metadata"])
            : undefined,
    });
}

export async function addActionEvent<T extends EventCode>(
    event: BaseEventAction<T>
): Promise<void> {
    return knex("events").insert({
        ...event,
        action_metadata: event["action_metadata"]
            ? hstore.stringify(event["action_metadata"])
            : undefined,
    });
}

export async function getEventListByUsername(
    username: string
): Promise<EventActionFromDB[]> {
    const eventList = await knex("events").where({
        action_on_username: username,
    });
    return eventList.map((event) => ({
        ...event,
        action_metadata: event.action_metadata
            ? hstore.parse(event.action_metadata)
            : {},
    }));
}
