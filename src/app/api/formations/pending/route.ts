import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/authoptions";
import { fetchGristPendingFormations } from "@/lib/formationsGrist";
import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";

export const dynamic = "force-dynamic";

/**
 * Formations en attente de validation, pour la pastille du menu.
 *
 * Interrogée depuis l'en-tête, présent sur toutes les pages : la réponse reste
 * volontairement minimale, et une erreur Grist renvoie une liste vide plutôt
 * que de faire échouer l'affichage du menu.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ formations: [] }, { status: 401 });
  }

  // Le tri des propositions ne regarde que l'équipe d'animation : pour tout le
  // monde d'autre, la liste est vide, pas seulement masquée.
  if (!(await isAnimationTeamMember(session.user))) {
    return NextResponse.json({ formations: [] });
  }

  try {
    const formations = await fetchGristPendingFormations();
    return NextResponse.json({
      formations: formations.map((formation) => ({
        id: formation.id,
        name: formation.name,
        animator: formation.animator ?? null,
      })),
    });
  } catch {
    return NextResponse.json({ formations: [] });
  }
}
