import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { routeTitles } from "@/utils/routes/routeTitles";
import { getSessionFromStore } from "@/server/middlewares/sessionMiddleware";
import { cookies } from "next/headers";
import config from "@/server/config";
import {
    fetchAirtableFormations,
    fetchAirtableInscription,
} from "@/lib/airtable";
import FormationList from "@/components/Formation/FormationList";

export const metadata: Metadata = {
    title: `${routeTitles.formationList()} / Espace Membre`,
};

export default async function Page() {
    const cookieStore = cookies();
    const session = (await getSessionFromStore(
        cookieStore.get(config.SESSION_COOKIE_NAME)
    )) as { id: string };
    if (!session) {
        redirect("/login");
    }
    const formations = await fetchAirtableFormations();
    const inscriptions = await fetchAirtableInscription(session.id);
    return (
        <div className="fr-container fr-container--fluid">
            <h1>{routeTitles.formationList()}</h1>
            <FormationList
                formations={formations}
                inscriptions={inscriptions}
            ></FormationList>
        </div>
    );
}
