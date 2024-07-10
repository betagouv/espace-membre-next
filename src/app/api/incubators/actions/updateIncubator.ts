"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { incubatorUpdateSchemaType } from "@/models/actions/incubator";
import { authOptions } from "@/utils/authoptions";

export async function updateIncubator({
    incubator,
    incubatorUuid,
}: {
    incubator: incubatorUpdateSchemaType;
    incubatorUuid: string;
}) {
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

    await db.transaction().execute(async (trx) => {
        // update incubator data
        await trx
            .updateTable("incubators")
            .set({
                ...incubator,
            })
            .where("uuid", "=", incubatorUuid)
            .execute();

        revalidatePath("/incubators");
    });
}
