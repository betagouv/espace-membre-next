import { InsertResult, Kysely, Transaction } from "kysely";
import { InsertExpression } from "kysely/dist/cjs/parser/insert-values-parser";
import { UpdateObjectExpression } from "kysely/dist/cjs/parser/update-set-parser";

import { DB, Missions } from "@/@types/db"; // generated with `npm run kysely-codegen`
import { db as database, jsonArrayFrom } from "@/lib/kysely";

export async function deleteMission(
    uuid: string,
    db: Kysely<DB> | Transaction<DB> = database,
) {
    return db.deleteFrom("missions").where("uuid", "=", uuid).execute();
}

export async function createMission(
    mission: InsertExpression<DB, "missions"> & {
        startups?: string[] | undefined;
    },
    db: Kysely<DB> | Transaction<DB> = database,
) {
    // Insert or update the mission and return the mission ID
    const query = async (trx) => {
        const startups = mission.startups || [];
        delete mission.startups;
        const result = await db
            .insertInto("missions")
            .values(mission)
            .returningAll()
            .execute();
        if (result && result.length) {
            for (const startup of startups) {
                await trx
                    .insertInto("missions_startups")
                    .values({
                        startup_id: startup,
                        mission_id: result[0].uuid,
                    })
                    .execute();
            }
        } else {
            throw new Error("Failed to insert or update mission");
        }
        return result ? result[0] : undefined;
    };
    let res;
    if (!db.isTransaction) {
        res = db.transaction().execute(query);
    } else {
        res = query(db as Transaction<DB>);
    }

    return res;
}

export async function updateMission(
    uuid: string,
    mission: UpdateObjectExpression<DB, "missions", "missions"> & {
        startups?: string[] | undefined;
    },
    db: Kysely<DB> | Transaction<DB>,
): Promise<number> {
    const query = async (trx: Transaction<DB>) => {
        // Insert or update the mission and return the mission ID
        const { startups, ...missionData } = mission;
        await trx
            .deleteFrom("missions_startups")
            .where("mission_id", "=", uuid)
            .execute();

        for (const startup of startups || []) {
            await trx
                .insertInto("missions_startups")
                .values({
                    startup_id: startup,
                    mission_id: uuid,
                })
                .execute();
        }

        const result = await trx
            .updateTable("missions")
            .set({
                ...missionData,
            })
            .where("uuid", "=", uuid)
            .execute();

        if (!result) {
            throw new Error("Failed to insert or update mission");
        }
        return 1;
    };
    let res;
    if (!db.isTransaction) {
        res = db.transaction().execute(query);
    } else {
        res = query(db as Transaction<DB>);
    }

    return res;
}
