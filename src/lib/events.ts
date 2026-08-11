import { Kysely } from "kysely";

import { db } from "./kysely";
import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import {
  EventAction,
  EventActionFromDB,
  EventCode,
} from "@/models/actionEvent/actionEvent";

export async function addEvent(event: EventAction, trx: Kysely<DB> = db) {
  return trx
    .insertInto("events")
    .values({
      ...event,
      action_metadata: event.action_metadata
        ? JSON.stringify(event.action_metadata)
        : null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getLastEvent(
  username: string,
  action_code: EventCode,
  trx: Kysely<DB> = db,
): Promise<EventActionFromDB | null> {
  const event = await trx
    .selectFrom("events")
    .selectAll()
    .where("action_on_username", "=", username)
    .where("action_code", "=", action_code)
    .orderBy("created_at", "desc")
    .executeTakeFirst();
  return (event as EventActionFromDB | undefined) ?? null;
}

export async function getEventListByUsername(username: string) {
  return db
    .selectFrom("events")
    .selectAll()
    .where("action_on_username", "=", username)
    .orderBy("created_at", "desc")
    .execute();
}

export async function getEventListByStartupUuid(startupUuid: string) {
  return db
    .selectFrom("events")
    .selectAll()
    .where("action_on_startup", "=", startupUuid)
    .orderBy("created_at", "desc")
    .execute();
}
