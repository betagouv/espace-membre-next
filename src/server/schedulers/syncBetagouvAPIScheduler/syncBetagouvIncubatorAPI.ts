// import { Incubator } from "@/models/incubator";
// import betagouv from "@/server/betagouv";
// import { getOrCreateDBIncubator } from "@/server/db/dbIncubator";
// import { getDBSponsor } from "@/server/db/dbSponsor";

// export async function syncBetagouvIncubatorAPI() {
//     const incubators: Incubator[] = await betagouv.incubators();

//     for (const incubator of incubators) {
//         await getOrCreateDBIncubator({
//             ghid: incubator.ghid,
//             owner_id: (
//                 await getDBSponsor({
//                     ghid: (incubator.owner || "").replace(
//                         "/organisations/",
//                         ""
//                     ),
//                 })
//             )?.uuid,
//             title: incubator.title,
//             contact: incubator.contact,
//             address: incubator.address,
//             website: incubator.website,
//             github: incubator.github,
//         });
//     }
// }
