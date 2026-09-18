"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/authorization/subject";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import {
  incubatorUpdateSchema,
  incubatorUpdateSchemaType,
} from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { incubatorToModel } from "@/models/mapper";
import { UnwrapPromise, withErrorHandling } from "@/lib/error";

export async function createIncubator({
  incubator,
}: {
  incubator: incubatorUpdateSchemaType["incubator"];
}): Promise<incubatorSchemaType> {
  // Il n'existe aucune equipe a qui deleguer la creation d'un incubateur qui
  // n'existe pas encore : la restriction aux admins est assumee.
  const subject = await requireAdmin();
  const memberData = incubatorUpdateSchema.shape.incubator.parse(incubator);
  let newIncubator;
  await db.transaction().execute(async (trx) => {
    // update incubator data
    newIncubator = await trx
      .insertInto("incubators")
      .values({
        ...memberData,
      })
      .returningAll()
      .executeTakeFirst();
  });

  if (!newIncubator) {
    throw new Error("Incubator data could not be inserted into db");
  }

  await addEvent({
    action_code: EventCode.INCUBATOR_CREATED,
    created_by_username: subject.username,
    action_metadata: {
      uuid: (newIncubator as { uuid: string }).uuid,
      ghid: (newIncubator as { ghid: string }).ghid,
      title: (newIncubator as { title: string }).title,
    },
  });

  revalidatePath("/incubators");

  return incubatorToModel(newIncubator);
}

export const safeCreateIncubator = withErrorHandling<
  UnwrapPromise<ReturnType<typeof createIncubator>>,
  Parameters<typeof createIncubator>
>(createIncubator);
