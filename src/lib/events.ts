import hstore from "@/lib/hstore";
import { ActionEvent, EventCode, EventParam } from "@/models/actionEvent";
import knex from "@db";

export async function addEvent(
    eventCode: EventCode,
    param: EventParam
): Promise<void> {
    const event: ActionEvent = {
        action_code: eventCode,
        action_metadata: param.action_metadata,
        action_on_username: param.action_on_username,
        created_by_username: param.created_by_username,
    };
    return knex("events").insert({
        ...event,
        action_metadata: param.action_metadata
            ? hstore.stringify(param.action_metadata)
            : undefined,
    });
}

export async function getEventListByUsername(
    username: string
): Promise<ActionEvent[]> {
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
