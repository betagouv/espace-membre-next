import { sql, ExpressionBuilder } from "kysely";

import { DB } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db, jsonArrayFrom } from "@/lib/kysely";

/** Return all incubators */
export function getAllIncubators() {
    return db.selectFrom("incubators").selectAll().execute();
}

/** Return all incubators */
export async function getAllIncubatorsOptions() {
    const incubs = await getAllIncubators();
    return incubs.map((incub) => ({
        value: incub.uuid,
        label: `${incub.title} ${incub.ghid ? `(${incub.ghid})` : ""}`,
    }));
}

/** Return all incubators */
export async function getIncubator(uuid: string) {
    return await db
        .selectFrom("incubators")
        .selectAll()
        .where("uuid", "=", uuid)
        .executeTakeFirst();
}
