import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { FormationProposalForm } from "@/components/Formation/FormationProposalForm";
import { fetchGristFormationImages } from "@/lib/formationsGrist";
import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";
import { getUserBasicInfo } from "@/lib/kysely/queries/users";
import { routeTitles } from "@/lib/routes";
import { authOptions } from "@/lib/authoptions";

export const metadata: Metadata = {
  title: `${routeTitles.formationProposal()} / Espace Membre`,
};

export default async function FormationProposalPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // Décide du libellé seulement : le statut réel est recalculé côté serveur au
  // moment de l'enregistrement, jamais reçu du client.
  const isAnimation = await isAnimationTeamMember(session.user);

  // Pré-remplit l'animateur·ice et l'email avec le profil du déposant, qui
  // propose le plus souvent une formation qu'il ou elle animera.
  const user = await getUserBasicInfo({ uuid: session.user.uuid });
  const defaultValues = {
    animateur: user?.fullname || "",
    animateurTchap: user?.primary_email || "",
    emailOrganisateur: user?.primary_email || user?.secondary_email || "",
  };

  // Une panne de la banque d'images ne doit pas empêcher de déposer une
  // formation : sans elle, l'envoi d'un fichier reste disponible.
  let images: Awaited<ReturnType<typeof fetchGristFormationImages>> = [];
  try {
    images = await fetchGristFormationImages();
  } catch {
    // La liste vide suffit.
  }

  return (
    <div className="fr-container fr-container--fluid">
      <h1>{isAnimation ? "Créer une formation" : "Proposer une formation"}</h1>
      <p>
        {isAnimation
          ? "La formation sera ajoutée au catalogue, tu pourras ensuite planifier des sessions."
          : "Tu connais un sujet et tu veux le partager avec la communauté ? Propose une formation, l'équipe d'animation reviendra vers toi."}
      </p>
      <FormationProposalForm
        images={images}
        isAnimation={isAnimation}
        defaultValues={defaultValues}
      />
    </div>
  );
}
