// import { differenceInDays } from "date-fns/differenceInDays";
// import _ from "lodash";

// import { Startups } from "@/@types/db";
// import { DBUser, createDBUserAndMission } from "@/models/dbUser/dbUser";
// import { Member } from "@/models/member";
// import { DBMission, Mission } from "@/models/mission";
// import { createMission } from "@/server/db/dbMission";
// import { getAllUsersPublicInfo } from "@/server/db/dbUser";
// import betagouv from "@betagouv";
// import { computeHash } from "@controllers/utils";
// import db from "@db";

// function compareUserAndTriggerOnChange(
//     newUserInfo: DBUser,
//     previousUserInfo: DBUser
// ) {
//     if (
//         previousUserInfo &&
//         !_.isEqual(
//             (newUserInfo.startups || []).sort(),
//             (previousUserInfo.startups || []).sort()
//         )
//     ) {
//         console.info(`Changement de startups pour ${newUserInfo.username}`);
//     }
// }

// export async function syncBetagouvUserAPI() {
//     const members = await betagouv.usersInfos();
//     const allStartups: Startups[] = await db("startups");
//     // Truncate multiple dependent tables with CASCADE
//     await db.raw("TRUNCATE TABLE users_startups, missions, missions_startups");

//     for (const member of members) {
//         console.log(member);
//         const previousUserInfo: DBUser = await db("users")
//             .where({
//                 username: member.id,
//             })
//             .first();

//         let nb_days_at_beta = member.missions.reduce((acc, mission) => {
//             let end = new Date(mission.end);
//             if (end > new Date()) {
//                 // if date is in the future
//                 end = new Date();
//             }
//             return acc + differenceInDays(new Date(mission.start), end);
//         }, 0);

//         const [user]: DBUser[] = await db("users")
//             .insert({
//                 domaine: member.domaine,
//                 github: member.github,
//                 // missions: JSON.stringify(member.missions),
//                 startups: member.startups,
//                 // nb_days_at_beta,
//                 bio: member.bio,
//                 username: member.id,
//                 member_type: member.memberType,
//                 fullname: member.fullname,
//                 role: member.role,
//             })
//             .onConflict("username")
//             .merge()
//             // .where({
//             //     username: member.id,
//             // })
//             .returning("*");
//         const startups = member.startups || [];
//         for (const startup of startups) {
//             await db("users_startups").insert({
//                 startup_id: startup,
//                 user_id: user.uuid,
//             });
//         }
//         const missions: Mission[] = member.missions;
//         for (const mission of missions) {
//             let startup_ids: string[] = [];
//             if (mission.startups) {
//                 for (const startupId of mission.startups) {
//                     const se = allStartups.find((s) => s.id === startupId);
//                     if (se) {
//                         startup_ids.push(se.uuid);
//                     }
//                 }
//             }

//             createMission({
//                 startups: startup_ids,
//                 username: member.id,
//                 status: mission.status,
//                 employer: mission.employer,
//                 start: new Date(mission.start),
//                 end: new Date(mission.end),
//                 user_id: user.uuid,
//             });

//             // if (member.startups && member.startups.length) {
//             //     for (const startup of startups) {
//             //         const memberMission: Omit<DBMission, "id"> = {
//             //             username: member.id,
//             //             startup: startup,
//             //             status: mission.status,
//             //             employer: mission.employer,
//             //             start: new Date(mission.start),
//             //             end: new Date(mission.end),
//             //         };
//             //         await db("missions").insert(memberMission);
//             //     }
//             // } else {
//             //     const memberMission: Omit<DBMission, "id" | "startup"> = {
//             //         username: member.id,
//             //         status: mission.status,
//             //         employer: mission.employer,
//             //         start: new Date(mission.start),
//             //         end: new Date(mission.end),
//             //     };
//             //     await db("missions").insert(memberMission);
//             // }
//         }
//         if (user) {
//             await db("user_details")
//                 .insert({
//                     hash: computeHash(member.id),
//                     domaine: member.domaine,
//                     active: user.primary_email_status === "EMAIL_ACTIVE",
//                     nb_days_at_beta,
//                 })
//                 .onConflict("hash")
//                 .merge();
//         }
//         //compareUserAndTriggerOnChange(previousUserInfo, user);
//     }
// }
