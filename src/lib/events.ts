import { Kysely } from "kysely";
import { ZodSchema } from "zod";

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
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getLastEvent(
  username: string,
  action_code: EventCode,
  trx?: Kysely<DB>,
): Promise<EventAction | null> {
  const event = await db
    .selectFrom("events")
    .selectAll()
    .where("action_on_username", "=", username)
    .where("action_code", "=", action_code)
    .orderBy("created_at desc")
    .executeTakeFirst();
  return event
    ? ({
        ...event,
        action_code: event.action_code as EventAction["action_code"],
        action_on_username: event.action_on_username || undefined,
        action_metadata: event.action_metadata
          ? hstore.parse(event.action_metadata)
          : {},
      } as EventAction)
    : null;
}

export async function addActionEvent<T extends EventCode>(
  event: BaseEventAction<T>,
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

export async function getLastEventListStartupUuids(startupUuids: string[]) {
  const eventList = await db
    .selectFrom("events")
    .selectAll()
    .where("action_on_startup", "in", startupUuids)
    .distinctOn(["action_on_startup"]) // Keep only the latest per startup
    .orderBy("action_on_startup") // Required for DISTINCT ON
    .orderBy("created_at", "desc") // Ensure latest event is chosen
    .execute();
  return eventList.map((event) => ({
    ...event,
    action_metadata: event.action_metadata
      ? hstore.parse(event.action_metadata)
      : {},
  }));
}
