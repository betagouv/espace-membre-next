import { Insertable, Selectable, Updateable } from "kysely";

import { BadgeRequests } from "@/@types/db";
import { db } from "@/lib/kysely";

const BADGE_REQUEST_TABLE = "badge_requests";

export const createBadgeRequest = (
  props: Insertable<BadgeRequests>,
): Promise<Selectable<BadgeRequests> | undefined> => {
  return db
    .insertInto(BADGE_REQUEST_TABLE)
    .values({
      ...props,
    })
    .returningAll()
    .executeTakeFirst();
};

export const updateBadgeRequest = async (
  props: Updateable<BadgeRequests>,
  username: string,
): Promise<void> => {
  console.log(props, username);
  await db
    .updateTable(BADGE_REQUEST_TABLE)
    .set({
      ...props,
    })
    .where("username", "=", username);
  return;
};

export const getBadgeRequest = (
  username: string,
): Promise<Selectable<BadgeRequests> | undefined> => {
  return db
    .selectFrom(BADGE_REQUEST_TABLE)
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();
};

export const getBadgeRequestWithStatus = (
  username: string,
  status: BadgeRequests["status"],
): Promise<Selectable<BadgeRequests> | undefined> => {
  return db
    .selectFrom(BADGE_REQUEST_TABLE)
    .selectAll()
    .where("username", "=", username)
    .where("status", "=", status)
    .orderBy("created_at", "desc")
    .executeTakeFirst();
};
