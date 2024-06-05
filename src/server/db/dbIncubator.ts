import { InsertObject } from "kysely/dist/cjs/parser/insert-values-parser";

import { DB } from "@/@types/db";
import { db } from "@/lib/kysely";

export const getDBIncubator = (params: { id: string } | { ghid: string }) => {
    if ("id" in params) {
        return db
            .selectFrom("incubators")
            .selectAll()
            .where("uuid", "=", params.id)
            .execute();
    } else if (params.ghid) {
        return db
            .selectFrom("incubators")
            .selectAll()
            .where("ghid", "=", params.ghid)
            .execute();
    }
};

export const getAllIncubators = () => {
    return db.selectFrom("incubators").selectAll();
};

export const getOrCreateDBIncubator = async (
    incubator: InsertObject<DB, "incubators">
) => {
    let existingIncubator;
    if (incubator.ghid) {
        existingIncubator = db
            .selectFrom("incubators")
            .where("ghid", "=", incubator.ghid)
            .selectAll().execute;
    }
    if (existingIncubator) {
        return existingIncubator;
    } else {
        return db
            .insertInto("incubators")
            .values(incubator)
            .returningAll()
            .executeTakeFirst();
    }
};
