"use server";

import _ from "lodash";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { db } from "@/lib/kysely";
import {
    incubatorUpdateSchema,
    incubatorUpdateSchemaType,
} from "@/models/actions/incubator";
import { incubatorSchemaType } from "@/models/incubator";
import { incubatorToModel } from "@/models/mapper";
import { authOptions } from "@/utils/authoptions";
import {
    AuthorizationError,
    UnwrapPromise,
    withErrorHandling,
} from "@/utils/error";

export async function createIncubator({
    incubator,
}: {
    incubator: incubatorUpdateSchemaType["incubator"];
}): Promise<incubatorSchemaType> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
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
    revalidatePath("/incubators");

    return incubatorToModel(newIncubator);
}

export const safeCreateIncubator = withErrorHandling<
    UnwrapPromise<ReturnType<typeof createIncubator>>,
    Parameters<typeof createIncubator>
>(createIncubator);
