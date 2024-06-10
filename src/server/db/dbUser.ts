// import db from ".";
// import { createMission, createOrUpdateMission } from "./dbMission";
// import {
//     DBUser,
//     DBUserAndMission,
//     DBUserPublic,
//     DBUserPublicAndMission,
//     createDBUserAndMission,
// } from "@/models/dbUser";
// import { DBMission } from "@/models/mission";

// export const getDBUser = (username: string): Promise<DBUser | undefined> => {
//     return db("users").where({ username }).first();
// };

// export const getAllUsersPublicInfo = (): Promise<DBUserPublic[]> => {
//     return db("users").select("username", "fullname", "github", "role", "uuid");
// };

// export const getAllUsers = (): Promise<DBUser[]> => {
//     return db("users");
// };

// export const getActiveUsers = (): Promise<DBUserPublic[]> => {
//     throw new Error("anotherFunction is not implemented yet.");
//     return db("users")
//         .select("username", "fullname", "github", "role")
//         .where({});
// };

// export const getDBUserAndMission = async (
//     username: string
// ): Promise<DBUserAndMission | undefined> => {
//     const user: DBUser = await db("users")
//         // .leftJoin("missions", "users.uuid", "missions.user_id")
//         .where("username", username)
//         .first();
//     let missions = await db("missions").where({
//         user_id: user.uuid,
//     });
//     for (let i: number = 0; i < missions.length; i++) {
//         const mission: DBMission = missions[i];
//         const startups = await db("missions_startups")
//             .rightJoin(
//                 "startups",
//                 "missions_startups.startup_id",
//                 "startups.uuid"
//             )
//             .where("missions_startups.mission_id", mission.uuid)
//             .select("startups.*"); // This selects all columns from the 'startups' table

//         missions[i].startups = startups;
//         // .outerJoin(
//         //     "startups",
//         //     "missions_startups.startup_id",
//         //     "startups.uuid"
//         // ).select(),
//     }
//     console.log(missions);
//     return { ...user, missions };
// };

// interface DBUserPublicWithMission extends DBUserPublic {
//     end: Date;
// }

// export const getDBUsersForStartup = (
//     startup: string
// ): Promise<DBUserPublicWithMission[]> => {
//     return db("missions_startups")
//         .distinct(
//             "users.username",
//             "users.fullname",
//             "users.github",
//             "users.role",
//             "users.uuid",
//             "missions.end"
//         )
//         .where({
//             startup_id: startup,
//         })
//         .rightJoin("missions", "missions.uuid", "mission_id")
//         .rightJoin("users", "user_id", "users.uuid");
// };

// export const getAllDBUsersAndMission = (): Promise<DBUserAndMission[]> => {
//     return db("users")
//         .leftJoin("missions", "users.username", "missions.username")
//         .select("users.*", "missions.*");
// };

// export function createOrUpdateDBUser(
//     startupData: createDBUserAndMission,
//     trx = db
// ) {
//     let { missions, ...data } = startupData;
//     return trx
//         .transaction((trx) => {
//             // First, insert the new startup
//             return trx
//                 .insert({
//                     ...data,
//                 })
//                 .into("users")
//                 .onConflict("username")
//                 .merge()
//                 .returning("*")
//                 .then(async ([user]: DBUser[]) => {
//                     console.log("Inserted startup with ID:", user.uuid);
//                     // organization_ids = organization_ids || [];
//                     for (const mission of missions) {
//                         // Now, use the same transaction to link to an organization
//                         await createOrUpdateMission(
//                             {
//                                 ...mission,
//                                 user_id: user.uuid,
//                                 username: user.uuid,
//                             },
//                             trx
//                         );
//                     }
//                     return [user];
//                 })
//                 .then(trx.commit) // Commit the transaction if all operations succeed
//                 .catch(trx.rollback); // Rollback the transaction in case of an error
//         })
//         .then(() => {
//             console.log(
//                 "Transaction complete: Startup and its link to organization have been saved."
//             );
//         })
//         .catch((error) => {
//             console.error("Transaction failed:", error);
//         });
// }
