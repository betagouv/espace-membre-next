"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";

import { assertCanEditIncubator } from "@/lib/authorization/incubator";
import { addEvent } from "@/lib/events";
import { db } from "@/lib/kysely";
import { EventCode } from "@/models/actionEvent/actionEvent";
import {
  incubatorUpdateSchema,
  incubatorUpdateSchemaType,
} from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { NoDataError, UnwrapPromise, withErrorHandling } from "@/lib/error";

// hstore n'accepte ni objet imbrique ni tableau : les textes longs sont
// encodes (comme updateTeam le fait pour mission) et highlighted_startups est
// joint en chaine.
const flattenIncubator = (row: {
  title: string;
  ghid: string;
  short_description: string | null;
  description: string | null;
  contact: string | null;
  address: string | null;
  website: string | null;
  github: string | null;
  owner_id: string | null;
  highlighted_startups: string[] | null;
}): Record<string, string> => ({
  title: row.title,
  ghid: row.ghid,
  short_description: encodeURIComponent(row.short_description || ""),
  description: encodeURIComponent(row.description || ""),
  contact: row.contact || "",
  address: row.address || "",
  website: row.website || "",
  github: row.github || "",
  owner_id: row.owner_id || "",
  highlighted_startups: (row.highlighted_startups || []).join(","),
});

export async function updateIncubator({
  incubator,
  incubatorUuid,
}: {
  incubator: incubatorUpdateSchemaType["incubator"];
  incubatorUuid: string;
}): Promise<incubatorSchemaType> {
  const subject = await assertCanEditIncubator(incubatorUuid);
  const data = incubatorUpdateSchema.shape.incubator.parse(incubator);
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
        ...data,
        owner_id: data.owner_id || undefined, // explicitly set owner_id to undefined
      })
      .where("uuid", "=", incubatorUuid)
      .returningAll()
      .executeTakeFirstOrThrow();
    revalidatePath("/incubators");
  });
  if (!updatedIncubator) {
    throw new Error("Incubator data could not be inserted into db");
  }

  await addEvent({
    action_code: EventCode.INCUBATOR_UPDATED,
    created_by_username: subject.username,
    action_metadata: {
      uuid: incubatorUuid,
      // hstore est plat : les textes longs sont encodes comme le fait
      // updateTeam pour mission, et highlighted_startups est joint.
      value: flattenIncubator(updatedIncubator),
      old_value: flattenIncubator(previousIncubatorData),
    },
  });

  return updatedIncubator;
}

export const safeUpdateIncubator = withErrorHandling<
  UnwrapPromise<ReturnType<typeof updateIncubator>>,
  Parameters<typeof updateIncubator>
>(updateIncubator);
