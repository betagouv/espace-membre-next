"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import { incubatorUpdateSchemaType } from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { authOptions } from "@/lib/authoptions";
import {
  AuthorizationError,
  NoDataError,
  UnwrapPromise,
  withErrorHandling,
} from "@/lib/error";

export async function updateIncubator({
  incubator,
  incubatorUuid,
}: {
  incubator: incubatorUpdateSchemaType["incubator"];
  incubatorUuid: string;
}): Promise<incubatorSchemaType> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.id) {
    throw new AuthorizationError();
  }
  const previousIncubatorData = await db
    .selectFrom("incubators")
    .selectAll()
    .where("uuid", "=", incubatorUuid)
    .executeTakeFirst();
  if (!previousIncubatorData) {
    throw new NoDataError("Cannot find incubator");
  }
  let updatedIncubator;
  await db.transaction().execute(async (trx) => {
    // update incubator data
    updatedIncubator = await trx
      .updateTable("incubators")
      .set({
        ...incubator,
        owner_id: incubator.owner_id || undefined, // explicitly set owner_id to undefined
      })
      .where("uuid", "=", incubatorUuid)
      .returningAll()
      .executeTakeFirstOrThrow();

    await addEvent(
      {
        action_code: EventCode.INCUBATOR_UPDATED,
        created_by_username: session.user.id,
        action_metadata: {
          value: { ...updatedIncubator },
          old_value: { ...previousIncubatorData },
        },
      },
      trx,
    );

    revalidatePath("/incubators");
  });
  if (!updatedIncubator) {
    throw new Error("Incubator data could not be inserted into db");
  }
  return updatedIncubator;
}

export const safeUpdateIncubator = withErrorHandling<
  UnwrapPromise<ReturnType<typeof updateIncubator>>,
  Parameters<typeof updateIncubator>
>(updateIncubator);
