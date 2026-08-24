import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { FormationProposalForm } from "@/components/Formation/FormationProposalForm";
import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";
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

  return (
    <div className="fr-container fr-container--fluid">
      <h1>{isAnimation ? "Créer une formation" : "Proposer une formation"}</h1>
      <p>
        {isAnimation
          ? "La formation sera ajoutée au catalogue, tu pourras ensuite planifier des sessions."
          : "Tu connais un sujet et tu veux le partager avec la communauté ? Propose une formation, l'équipe d'animation reviendra vers toi."}
      </p>
      <FormationProposalForm isAnimation={isAnimation} />
    </div>
  );
}
