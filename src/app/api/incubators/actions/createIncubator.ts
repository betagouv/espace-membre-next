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
import { authOptions } from "@/utils/authoptions";
import { AuthorizationError } from "@/utils/error";

export async function createIncubator({
    incubator,
}: {
    incubator: incubatorUpdateSchemaType;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new AuthorizationError();
    }
    const memberData = incubatorUpdateSchema.shape.incubator.parse(
        incubator.incubator
    );

    await db.transaction().execute(async (trx) => {
        // update incubator data
        const res = await trx
            .insertInto("incubators")
            .values({
                ...memberData,
            })
            .returning("uuid")
            .executeTakeFirst();

        if (!res) {
            throw new Error("Incubator data could not be inserted into db");
        }

        revalidatePath("/incubators");
    });
}
