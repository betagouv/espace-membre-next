import { routes, routeTitles } from "@/lib/routes";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import FormationList from "@/components/Formation/FormationList";
import {
  fetchAirtableFormations,
  fetchAirtableInscription,
} from "@/lib/airtable";
import config from "@/server/config";
import { authOptions } from "@/lib/authoptions";
import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

export const metadata: Metadata = {
  title: `${routeTitles.formationList()} / Espace Membre`,
};

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  // Airtable indisponible ne doit pas emporter toute la page : on affiche le
  // catalogue vide avec une alerte, le bouton de proposition reste utilisable.
  let formations: Awaited<ReturnType<typeof fetchAirtableFormations>> = [];
  let inscriptions: Awaited<ReturnType<typeof fetchAirtableInscription>> = [];
  let catalogueError = false;
  try {
    formations = await fetchAirtableFormations();
    inscriptions = await fetchAirtableInscription(session.user.id);
  } catch {
    catalogueError = true;
  }
  const isAnimation = await isAnimationTeamMember(session.user);
  return (
    <div className="fr-container fr-container--fluid">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h1>{routeTitles.formationList()}</h1>
        <Button
          priority="secondary"
          linkProps={{ href: routes.formationProposal() }}
        >
          {isAnimation ? "Créer une formation" : "Proposer une formation"}
        </Button>
      </div>
      {catalogueError && (
        <Alert
          className="fr-mb-4w"
          severity="warning"
          title="Catalogue momentanément indisponible"
          description="La liste des formations n'a pas pu être chargée. Tu peux quand même proposer une formation."
        />
      )}
      <FormationList
        formations={formations}
        inscriptions={inscriptions}
      ></FormationList>
    </div>
  );
}
