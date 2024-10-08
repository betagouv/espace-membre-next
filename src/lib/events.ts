import { Kysely } from "kysely";

import { db } from "./kysely";
import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import * as hstore from "@/lib/hstore";
import {
    BaseEventAction,
    EventAction,
    EventCode,
} from "@/models/actionEvent/actionEvent";

export async function addEvent(event: EventAction, trx?: Kysely<DB>) {
    return (trx || db)
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

export async function getEventListByStartupUuid(startupUuid: string) {
    const eventList = await db
        .selectFrom("events")
        .selectAll()
        .where("action_on_startup", "=", startupUuid)
        .orderBy("created_at desc")
        .execute();
    return eventList.map((event) => ({
        ...event,
        action_metadata: event.action_metadata
            ? hstore.parse(event.action_metadata)
            : {},
    }));
}
