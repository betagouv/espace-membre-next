import {
    InsertExpression,
    InsertObject,
} from "kysely/dist/cjs/parser/insert-values-parser";

import { DB } from "@/@types/db";
import { db } from "@/lib/kysely";

export const getDBSponsor = (
    params:
        | {
              ghid: string;
          }
        | { id: string }
) => {
    if ("id" in params) {
        return db
            .selectFrom("organizations")
            .where("uuid", "=", params.id)
            .executeTakeFirst();
    } else {
        return db
            .selectFrom("organizations")
            .where("ghid", "=", params.ghid)
            .executeTakeFirst();
    }
};

export const getAllSponsors = () => {
    return db.selectFrom("organizations").selectAll().execute();
};

export const getOrCreateSponsor = async (
    sponsor: InsertObject<DB, "organizations">
) => {
    // Try to find the incubator
    let existingIncubator;
    if (sponsor.ghid) {
        existingIncubator = await db
            .selectFrom("organizations")
            .selectAll()
            .where("ghid", "=", sponsor.ghid)
            .executeTakeFirst();
    }

    if (existingIncubator) {
        // If the incubator exists, return it
        return existingIncubator;
    } else {
        // If the incubator does not exist, create it
        const [newIncubator] = await db
            .insertInto("organizations")
            .values(sponsor)
            .returningAll()
            .execute();

        return newIncubator;
    }
};
