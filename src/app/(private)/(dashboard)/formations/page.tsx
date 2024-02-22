import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { cookies } from "next/headers";
import config from "@/server/config";
import Airtable from "airtable";
import { Formation, formationSchema } from "@/models/formation";
import FormationCard from "@/components/Formation/FormationCard";
import { airtableRecordToFormation } from "@/utils/airtable";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

async function fetchAirtableFormation(): Promise<Formation[]> {
    var base = new Airtable({ apiKey: config.AIRTABLE_API_KEY }).base(
        config.AIRTABLE_FORMATION_BASE_ID!
    );
    return new Promise((resolve, reject) => {
        const recordsAsObjects: Formation[] = [];
        base("Formations")
            .select({
                view: "Formations à venir",
            })
            .eachPage(
                (records, fetchNextPage) => {
                    // Process each record and add it to the array
                    records.forEach((record) => {
                        console.log(record.get("Email organisateur"));
                        try {
                            const formationItem =
                                airtableRecordToFormation(record);
                            recordsAsObjects.push(formationItem);
                        } catch (e) {
                            console.log(e);
                        }
                    });
                    fetchNextPage();
                },
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(recordsAsObjects);
                    }
                }
            );
    });
}

export default async function Page() {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session) {
        redirect("/login");
    }
    const username = session.id;
    const formations = await fetchAirtableFormation();
    return (
        <div className="fr-container--fluid">
            <div className="fr-grid-row fr-grid-row--gutters">
                {formations.map((formation) => (
                    <div key={formation.id} className="fr-col-4">
                        <FormationCard formation={formation} />
                    </div>
                ))}
            </div>
        </div>
    );
}
