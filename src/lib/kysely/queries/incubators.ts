import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all startups */
export function getAllIncubators() {
    return db.selectFrom("incubators").selectAll().execute();
}

/** Return all startups */
export async function getIncubator(uuid: string) {
    return await db
        .selectFrom("incubators")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
}
