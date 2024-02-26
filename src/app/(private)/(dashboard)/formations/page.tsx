import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routeTitles } from "@/utils/routes/routeTitles";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { cookies } from "next/headers";
import config from "@/server/config";
import FormationCard from "@/components/Formation/FormationCard";
import { fetchAirtableFormations } from "@/lib/airtable";

export const metadata: Metadata = {
    title: `${routeTitles.accountEditBaseInfo()} / Espace Membre`,
};

export default async function Page() {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session) {
        redirect("/login");
    }
    const username = session.id;
    const formations = await fetchAirtableFormations();
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
