import { sql, Kysely, Expression } from "kysely";

import { MEMBER_PROTECTED_INFO } from "./users";
import { DB, StartupsPhaseEnum, UsersDomaineEnum } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db as database } from "@/lib/kysely";


// get list of startups with latest phase
export const getSesWithLatestPhaseQuery = (db: Kysely<DB> = database) =>
    db
        .with("latest_phases", (db) =>
            // compute SES latest phase
            db
                .selectFrom("phases")
                .select((eb) => [
                    "startup_id",
                    "name",
                    "start",
                    "end",
                    sql<number>`ROW_NUMBER() OVER (PARTITION BY startup_id ORDER BY "end" DESC NULLS FIRST, start desc)`.as(
                        "rn"
                    ),
                ])
        )
        .selectFrom("latest_phases")
        .where("latest_phases.rn", "=", 1)
        .orderBy("start", "desc");

// search and get users public info
export async function searchUsers(
    filters: URLSearchParams,
    db: Kysely<DB> = database
) {
    const startupPhases = (filters
        .get("startupPhases")
        ?.split(",")
        .filter(Boolean) || []) as StartupsPhaseEnum[];

    const validStartups: string[] = [];
    if (startupPhases.length) {
        // select appropriate SES before-hand
        const ses = await getSesWithLatestPhaseQuery()
            .select("startup_id")
            .where("latest_phases.name", "in", startupPhases)
            .execute();
        validStartups.push(...ses.map((s) => s.startup_id));
    }

    const query = db

        .with("users_expiry", (db) => {
            // PG CTE to check user max mission expiration
            return db
                .selectFrom("missions")
                .select((eb) => [
                    "user_id",
                    sql<boolean>`MAX(COALESCE(missions.end, '2200-02-02'))<=NOW()`.as(
                        "expired"
                    ),
                ])
                .groupBy("missions.user_id");
        })
        .selectFrom("users_expiry")
        .leftJoin("users", "users.uuid", "users_expiry.user_id")
        .leftJoin("missions", "missions.user_id", "users.uuid")
        .leftJoin(
            "missions_startups",
            "missions_startups.mission_id",
            "missions.uuid"
        )
        .leftJoin("startups", "startups.uuid", "missions_startups.startup_id")
        .select(({ eb, selectFrom }) => [
            ...MEMBER_PROTECTED_INFO, // aggregate startups names
            sql<
                Array<string>
            >`array_agg(startups.name order by startups.name)`.as("startups"),
        ])
        .where(({ eb, ref }) => {
            const conditions: Expression<any>[] = [];
            const domaines = (filters
                .get("domaines")
                ?.split(",")
                .filter(Boolean) || []) as UsersDomaineEnum[];
            const incubators =
                filters.get("incubators")?.split(",").filter(Boolean) || [];
            const memberStatus =
                filters.get("memberStatus")?.split(",").filter(Boolean) || [];
            const startups =
                filters.get("startups")?.split(",").filter(Boolean) || [];
            const competences =
                filters.get("competences")?.split(",").filter(Boolean) || [];
            if (domaines.length) {
                conditions.push(eb("domaine", "in", domaines));
            }
            if (incubators.length) {
                conditions.push(eb("startups.incubator_id", "in", incubators));
            }
            if (startups.length) {
                conditions.push(eb("startups.uuid", "in", startups));
            }
            if (competences.length) {
                // https://www.postgresql.org/docs/9.5/functions-json.html
                conditions.push(
                    eb(ref("competences"), "?&", eb.val(competences))
                );
            }
            if (validStartups.length) {
                conditions.push(eb("startups.uuid", "in", validStartups));
            }

            if (memberStatus.length) {
                const expiredStatus: boolean[] = [];
                if (memberStatus.includes("active")) {
                    expiredStatus.push(false);
                }
                if (memberStatus.includes("unactive")) {
                    expiredStatus.push(true);
                }
                if (expiredStatus.length === 1) {
                    conditions.push(eb("expired", "is", expiredStatus[0]));
                } else {
                    conditions.push(
                        eb.or(expiredStatus.map((s) => eb("expired", "is", s)))
                    );
                }
            }

            return eb.and(conditions);
        })
        .groupBy([...MEMBER_PROTECTED_INFO])
        .orderBy(["users.fullname"])
        .compile();

    //console.log(query.sql);
    const userInfos = await db.executeQuery(query);

    return userInfos.rows;
}
