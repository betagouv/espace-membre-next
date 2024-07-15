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

export async function createIncubator({
    incubator,
}: {
    incubator: incubatorUpdateSchemaType;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.id) {
        throw new Error(`You don't have the right to access this function`);
    }
    incubatorUpdateSchema.parse(incubator);
    await db.transaction().execute(async (trx) => {

        // update incubator data
        const res = await trx
            .insertInto("incubators")
            .values({
                website: incubator.website,
                github: incubator.github,
                ghid: incubator.ghid,
                title: incubator.title,
                address: incubator.address,
                contact: incubator.contact,
            })
            .returning("uuid")
            .executeTakeFirst();
        console.log("LCS TOTO 3");

        if (!res) {
            throw new Error("Incubator data could not be inserted into db");
        }

        revalidatePath("/incubators");
    });
}
