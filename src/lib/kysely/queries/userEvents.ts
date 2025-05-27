import { db } from "@/lib/kysely";
import { mapToUserEvent } from "@/models/mapper/userEventMapper";

export async function getUserEvents(uuid: string) {
  return (
    await db
      .selectFrom("user_events")
      .where("user_id", "=", uuid)
      .selectAll()
      .execute()
  ).map(mapToUserEvent);
}
