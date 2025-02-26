import { raw } from "express";
import { Selectable } from "kysely";

import { Startups } from "@/@types/db";
import { db, sql } from "@/lib/kysely";

export const getLatests = () =>
    db
        .selectFrom("startups")
        .innerJoin("incubators", "incubators.uuid", "startups.incubator_id")
        .select([
            "startups.created_at",
            "startups.uuid",
            "startups.name",
            "startups.pitch",
            "incubators.title as incubator",
            "incubators.uuid as incubatorUuid",
        ])
        .orderBy("created_at", "desc")
        .limit(10)
        .execute();

export async function getStartupsWithAnyUpdateForThePastXMonthsRaw(
    numberOfMonths: number = 3
): Promise<Selectable<Startups>[]> {
    const rawQuery = sql`
WITH recent_events AS (
    SELECT DISTINCT e.action_on_username, 
           CASE 
               WHEN kv.value ~* '^[0-9a-fA-F-]{36}$' THEN kv.value::UUID 
               ELSE NULL 
           END AS startup_id
    FROM events e, EACH(hstore(e.action_metadata)) AS kv
    WHERE e.created_at <= NOW() - INTERVAL '${numberOfMonths} months'
    AND kv.key LIKE 'value.missions.%.startups.%'
    AND EXISTS (
        SELECT 1
        FROM EACH(hstore(e.action_metadata)) AS old_kv
        WHERE old_kv.key LIKE 'old_value.missions%' 
        AND old_kv.value IS DISTINCT FROM kv.value
    )
),
users_filtered AS (
    SELECT DISTINCT u.uuid AS user_id, re.startup_id
    FROM recent_events re
    JOIN users u ON u.username = re.action_on_username
    WHERE re.startup_id IS NOT NULL
),
user_missions AS (
    SELECT DISTINCT um.user_id, um.uuid as mission_id, uf.startup_id
    FROM users_filtered uf
    JOIN missions um ON uf.user_id = um.user_id
),
mission_startups AS (
    SELECT DISTINCT ms.startup_id
    FROM user_missions um
    JOIN missions_startups ms ON um.mission_id = ms.mission_id
),
final_startups AS (
    SELECT DISTINCT startup_id FROM mission_startups
)
SELECT s.*
FROM startups s
LEFT JOIN final_startups fs ON s.uuid = fs.startup_id
WHERE fs.startup_id IS NULL;
`.execute(db);

    // const result = await db.executeQuery(rawQuery);
    return (await rawQuery).rows as Selectable<Startups>[];
}

// export function getStartupsWithAnyUpdateForThePastXMonths() {
//     const result = db
//         .selectFrom("events e")
//         .distinct()
//         .innerJoin(
//             sql`each(hstore(e.action_metadata))`.as("kv"),
//             "kv.key",
//             sql`like 'value.missions.%.startups.%'`
//         )
//         .select([
//             "e.action_on_username",
//             sql`CASE WHEN kv.value ~* '^[0-9a-fA-F-]{36}$' THEN kv.value::UUID ELSE NULL END`.as(
//                 "startup_id"
//             ),
//         ])
//         .where("e.created_at", "<=", sql`now() - interval '3 months'`)
//         .whereExists(
//             db
//                 .selectOne()
//                 .from(sql`each(hstore(e.action_metadata))`.as("old_kv"))
//                 .whereRaw("old_kv.key LIKE concat(?, kv.key)", ["old_value."])
//                 .whereRaw("old_kv.value IS DISTINCT FROM kv.value")
//         )
//         .as("recent_events")
//         .join("users u", "u.username", "recent_events.action_on_username")
//         .select(["u.uuid as user_id", "recent_events.startup_id"])
//         .whereNotNull("recent_events.startup_id")
//         .distinct()
//         .as("users_filtered")
//         .join("missions um", "users_filtered.user_id", "um.user_id")
//         .select([
//             "um.user_id",
//             "um.uuid as mission_id",
//             "users_filtered.startup_id",
//         ])
//         .distinct()
//         .as("user_missions")
//         .join(
//             "missions_startups ms",
//             "user_missions.mission_id",
//             "ms.mission_id"
//         )
//         .select(["ms.startup_id"])
//         .distinct()
//         .as("mission_startups")
//         .selectFrom("mission_startups")
//         .select(["startup_id"])
//         .distinct()
//         .as("final_startups")
//         .leftJoin("startups s", "s.uuid", "final_startups.startup_id")
//         .whereNull("final_startups.startup_id")
//         .select(["s.*"]);

//     return await result.execute();
// }
