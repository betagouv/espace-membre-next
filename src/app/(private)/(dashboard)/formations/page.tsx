import { routes, routeTitles } from "@/lib/routes";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import FormationList from "@/components/Formation/FormationList";
import { FormationPendingMenu } from "@/components/Formation/FormationPendingMenu";
import { FormationUpcomingBanner } from "@/components/Formation/FormationUpcomingBanner";
import {
  fetchGristFormations,
  fetchGristInscriptions,
  fetchGristPendingFormations,
} from "@/lib/formationsGrist";
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
  // Catalogue et inscriptions viennent tous deux de Grist, mais de lectures
  // distinctes : une panne de l'une ne doit pas emporter l'autre, ni toute la
  // page.
  let formations: Awaited<ReturnType<typeof fetchGristFormations>> = [];
  let catalogueError = false;
  try {
    formations = await fetchGristFormations();
  } catch {
    catalogueError = true;
  }
  // Ses propres inscriptions, pour le bandeau de rappel et les pastilles
  // « Inscrit » du catalogue. Une panne de lecture les fait disparaître, elle
  // n'emporte pas le catalogue.
  let mesInscriptions: Awaited<ReturnType<typeof fetchGristInscriptions>> = [];
  try {
    mesInscriptions = await fetchGristInscriptions(session.user.id);
  } catch {
    // Sans elles, ni bandeau ni pastilles : le catalogue s'affiche quand même.
  }
  // `formation.sessions` ne contient que les dates à venir : une séance passée
  // ne remonte donc jamais dans le bandeau.
  const mesProchaines = formations
    .flatMap((formation) =>
      (formation.sessions ?? []).flatMap((session) => {
        const inscription = mesInscriptions.find(
          (i) => i.sessionId === session.id,
        );
        return inscription
          ? [
              {
                formationId: formation.id,
                sessionId: session.id,
                titre: formation.name,
                imageUrl: formation.imageUrl,
                start: session.start,
                onWaitingList: inscription.onWaitingList,
              },
            ]
          : [];
      }),
    )
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0));

  const isAnimation = await isAnimationTeamMember(session.user);

  // Les propositions ne sont pas au catalogue : sans cette liste, l'équipe
  // d'animation n'a aucun moyen de savoir qu'il y en a à examiner. Une panne
  // Grist ne doit pas emporter la page pour autant.
  let pending: Awaited<ReturnType<typeof fetchGristPendingFormations>> = [];
  if (isAnimation) {
    try {
      pending = await fetchGristPendingFormations();
    } catch {
      // Sans la liste, la page reste utilisable.
    }
  }
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
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <Button
            priority="secondary"
            linkProps={{ href: routes.formationProposal() }}
          >
            {isAnimation ? "Créer une formation" : "Proposer une formation"}
          </Button>
          <FormationPendingMenu
            formations={pending.map((formation) => ({
              id: formation.id,
              name: formation.name,
              animator: formation.animator,
            }))}
          />
        </div>
      </div>
      {catalogueError && (
        <Alert
          className="fr-mb-4w"
          severity="warning"
          title="Catalogue momentanément indisponible"
          description="La liste des formations n'a pas pu être chargée. Tu peux quand même proposer une formation."
        />
      )}
      <FormationUpcomingBanner formations={mesProchaines} />
      <FormationList
        formations={formations}
        inscriptions={mesInscriptions}
      ></FormationList>
    </div>
  );
}
