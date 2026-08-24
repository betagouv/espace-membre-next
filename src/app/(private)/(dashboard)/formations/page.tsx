import { routes, routeTitles } from "@/lib/routes";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import FormationList from "@/components/Formation/FormationList";
import { fetchAirtableInscription } from "@/lib/airtable";
import { fetchGristFormations } from "@/lib/formationsGrist";
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
  // Le catalogue vient de Grist. Les inscriptions restent sur Airtable le temps
  // que la migration soit terminée : une panne de l'un ne doit pas emporter
  // l'autre, ni toute la page.
  let formations: Awaited<ReturnType<typeof fetchGristFormations>> = [];
  let inscriptions: Awaited<ReturnType<typeof fetchAirtableInscription>> = [];
  let catalogueError = false;
  try {
    formations = await fetchGristFormations();
  } catch {
    catalogueError = true;
  }
  try {
    inscriptions = await fetchAirtableInscription(session.user.id);
  } catch {
    // Sans inscriptions, le catalogue s'affiche : on perd seulement les
    // pastilles « Inscrit ».
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
