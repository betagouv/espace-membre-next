import { CompiledQuery, Selectable } from "kysely";

import { Startups } from "@/@types/db";
import { db } from "@/lib/kysely";
import { StartupPhase } from "@/models/startup";

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

export async function getStartupsWithoutAnyUpdateForThePastXMonthsRaw(
    numberOfMonths: number = 3
): Promise<Selectable<Startups & { current_phase: StartupPhase }>[]> {
    // Select all user events related to mission changes within the last 3 months
    // Then find the associated startups by navigating through users => users_missions => missions_startups => startups table
    // We'll refer to this result set as "A", representing all startups with user events in the past 3 months
    // Finally, calculate the difference between All Startups and A to obtain all startups without any updates in the last 3 months

    const rawQuery = CompiledQuery.raw(
        `
WITH recent_events AS (
    SELECT DISTINCT e.action_on_username, 
           CASE 
               WHEN kv.value ~* '^[0-9a-fA-F-]{36}$' THEN kv.value::UUID 
               ELSE NULL 
           END AS startup_id
    FROM events e, EACH(hstore(e.action_metadata)) AS kv
    WHERE e.created_at >= NOW() - INTERVAL '${numberOfMonths} months'
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
)
SELECT s.*, p.name as current_phase
FROM startups s
LEFT JOIN mission_startups fs ON s.uuid = fs.startup_id
LEFT JOIN (
    SELECT DISTINCT ON (startup_id) *
    FROM phases
    ORDER BY startup_id, start DESC
) p ON s.uuid = p.startup_id
WHERE fs.startup_id IS NULL AND NOT EXISTS (
        SELECT 1 
        FROM phases p 
        WHERE p.startup_id = s.uuid 
        AND (p.name = 'transfer' OR p.name = 'success' OR p.name = 'alumni')
    );
`,
        []
    );
    const result = await db.executeQuery<
        Selectable<Startups & { current_phase: StartupPhase }>
    >(rawQuery);
    return result.rows;
}
