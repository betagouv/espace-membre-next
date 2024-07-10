import { importFromZip } from "./utils";
import { db, sql } from "@lib/kysely";

const uniq = <T>(arr: T[]) => Array.from(new Set(arr));

// add missing missions from the root markdown .startups and .previously
const importData = async () => {
    // const res = await db
    //     .with("expiration_date", (db) =>
    //         db
    //             .selectFrom("missions")
    //             .select(({ fn }) => ["user_id", fn.max("end").as("expiration")])
    //             .groupBy("user_id")
    //     )
    //     .selectFrom(["users", "expiration_date"])
    //     .select([
    //         "users.username",
    //         "expiration_date.expiration",
    //         sql<boolean>`expiration_date.expiration < NOW()`.as("expired"),
    //     ])
    //     .where((eb) => eb("expiration_date.user_id", "=", eb.ref("users.uuid")))
    //     .execute();

    // console.table(res);

    // process.exit(0);

    const markdownData = await importFromZip();
    markdownData.authors.forEach(async (a) => {
        const missionStartups = uniq(
            a.attributes.missions?.flatMap((m) => m.startups || []) || []
        );
        const startups = a.attributes.startups || [];
        const previously = a.attributes.previously || [];
        const rootStartups = uniq([...startups, ...previously]);
        // compare
        if (missionStartups.length < rootStartups.length) {
            const userMissionsCount = a.attributes.missions?.length || 0;
            if (userMissionsCount >= 1) {
                rootStartups.forEach(async (startupGhid) => {
                    await db
                        .insertInto("missions_startups")
                        .values(({ selectFrom }) => ({
                            mission_id: selectFrom("missions")
                                .where(
                                    "user_id",
                                    "=",
                                    selectFrom("users")
                                        .where(
                                            "username",
                                            "=",
                                            a.attributes.ghid
                                        )
                                        .select("uuid")
                                )
                                .orderBy("end desc")
                                .limit(1)
                                .select("uuid"),
                            startup_id: selectFrom("startups")
                                .where("ghid", "=", startupGhid)
                                .select("uuid"),
                        }))
                        .onConflict((c) => {
                            console.log(`conflict ${a.attributes.ghid}`);
                            return c.doNothing();
                        })
                        .execute();
                });
            } else {
                console.error(`${a.attributes.ghid}: no mission`);
            }
        }
    });
};

importData();
