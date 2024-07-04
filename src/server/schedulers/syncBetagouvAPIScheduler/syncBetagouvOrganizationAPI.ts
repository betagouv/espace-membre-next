// import { Sponsor } from "@/models/sponsor";
// import betagouv from "@/server/betagouv";
// import { getOrCreateSponsor } from "@/server/db/dbSponsor";

// export async function syncBetagouvOrganizationAPI() {
//     const organizations: Sponsor[] = await betagouv.sponsors();

//     for (const organization of organizations) {
//         await getOrCreateSponsor({
//             ghid: organization.ghid,
//             name: organization.name,
//             acronym: organization.acronym,
//             domaine_ministeriel: organization.domaine_ministeriel,
//             type: organization.type,
//         });
//     }
// }
