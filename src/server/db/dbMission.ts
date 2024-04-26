import db from ".";
import { DBMission, createDBMission, updateDBMission } from "@/models/mission";

export const createMission = async (
    mission: createDBMission,

    trx = db
) => {
    const { startups, ...missionData } = mission;
    const [newMission]: DBMission[] = await trx("missions")
        .insert({
            ...missionData,
        })
        // .onConflict("uuid")
        // .merge()
        .returning("*");
    for (const startupId of startups) {
        await trx("missions_startups").insert({
            startup_id: startupId,
            mission_id: newMission.uuid,
        });
        // .onConflict(["startup_id", "mission_id"]) // Specify the conflict target columns
        // .ignore(); // Do nothing if conflict occurs
    }
};

export function createOrUpdateMission(
    mission: createDBMission | updateDBMission,
    trx = db
) {
    if (mission.uuid) {
        return updateMission(mission, trx);
    } else {
        return createMission(mission, trx);
    }
}

export async function updateMission(mission: updateDBMission, trx = db) {
    const { startups, ...missionData } = mission;
    const [newMission]: DBMission[] = await trx("missions")
        .insert({
            ...missionData,
        })
        .onConflict("uuid")
        .merge()
        .returning("*");
    for (const startupId of startups) {
        await trx("missions_startups")
            .insert({
                startup_id: startupId,
                mission_id: newMission.uuid,
            })
            .onConflict(["startup_id", "mission_id"]) // Specify the conflict target columns
            .ignore(); // Do nothing if conflict occurs
    }
}

export const deleteMission = async (missionId, trx = db) => {
    return trx("missions").where({ uuid: missionId }).del();
};

export const addMission = async (userId, missionData, trx = db) => {
    return trx("missions").insert({
        user_id: userId,
        description: missionData.description,
        status: missionData.status,
    });
};
