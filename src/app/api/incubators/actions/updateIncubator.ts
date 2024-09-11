"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { db } from "@/lib/kysely";
import { incubatorUpdateSchemaType } from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    NoDataError,
    UnwrapPromise,
    withErrorHandling,
} from "@/utils/error";

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
                ...inucubator,
                owner_id: incubator.owner_id || undefined, // explicitly set owner_id to undefined
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

export const safeUpdateIncubator = withErrorHandling<
    UnwrapPromise<ReturnType<typeof updateIncubator>>,
    Parameters<typeof updateIncubator>
>(updateIncubator);
