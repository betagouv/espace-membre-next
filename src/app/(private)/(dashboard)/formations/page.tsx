import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import FormationList from "@/components/Formation/FormationList";
import {
  fetchAirtableFormations,
  fetchAirtableInscription,
} from "@/lib/airtable";
import config from "@/server/config";
import { authOptions } from "@/utils/authoptions";
import { routeTitles } from "@/utils/routes/routeTitles";

export const metadata: Metadata = {
  title: `${routeTitles.formationList()} / Espace Membre`,
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  const formations = await fetchAirtableFormations();
  const inscriptions = await fetchAirtableInscription(session.user.id);
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
