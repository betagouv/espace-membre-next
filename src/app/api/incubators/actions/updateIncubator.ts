"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { incubatorUpdateSchemaType } from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { authOptions } from "@/utils/authoptions";

export async function updateIncubator({
    incubator,
    incubatorUuid,
}: {
    incubator: incubatorUpdateSchemaType;
    incubatorUuid: string;
}): incubatorSchemaType {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    const previousIncubatorData = await db
        .selectFrom("incubators")
        .selectAll()
        .where("uuid", "=", incubatorUuid)
        .executeTakeFirst();
    if (!previousIncubatorData) {
        throw new Error("Cannot find incubator");
    }
    let updatedIncubator;
    await db.transaction().execute(async (trx) => {
        // update incubator data
        updatedIncubator = await trx
            .updateTable("incubators")
            .set({
                ...inucubator.incubator,
                owner_id: incubator.incubator.owner_id || undefined, // explicitly set owner_id to undefined
            })
            .where("uuid", "=", incubatorUuid)
            .returningAll()
            .executeTakeFirstOrThrow();
        revalidatePath("/incubators");
    });
    if (!updatedIncubator) {
        throw new Error("Incubator data could not be inserted into db");
    }
    return updatedIncubator;
}
