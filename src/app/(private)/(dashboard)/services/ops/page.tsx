import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { OpsRequestForm } from "@/components/Service/OpsRequestForm";
import { StartupType } from "@/components/SESelect";
import { getAllStartups } from "@/lib/kysely/queries";
import {
  getMatrixIdByUserId,
  getUserBasicInfo,
  getUserStartupsActive,
} from "@/lib/kysely/queries/users";
import { userStartupToModel } from "@/models/mapper/startupMapper";
import { authOptions } from "@/lib/authoptions";

// Un seul libellé pour l'onglet du navigateur et pour le titre de la page :
// séparés, les deux se mettent à diverger, et l'onglet finit par annoncer autre
// chose que ce qu'on lit à l'écran.
const TITRE = "Demandes d'OPS";

export const metadata: Metadata = {
  title: `${TITRE} / Espace Membre`,
};

export default async function OpsRequestPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = await getUserBasicInfo({ uuid: session.user.uuid });
  const matrixId = await getMatrixIdByUserId(session.user.uuid);
  const email = user?.primary_email || user?.secondary_email || "";

  // Les produits du membre servent à pré-remplir le projet concerné, y compris
  // pour un admin : la liste déroulante lui montre tout le référentiel, mais
  // c'est bien sa propre mission qui pré-remplit le champ.
  const userStartups = (await getUserStartupsActive(session.user.uuid)).map(
    (startup) => userStartupToModel(startup),
  );

  // Startups the user can act on (admins see all) — used by the Sentry / Matomo
  // demandes to pick the concerned product.
  const startups = session.user.isAdmin ? await getAllStartups() : userStartups;
  const startupOptions: StartupType[] = startups.map((startup) => ({
    value: startup.uuid,
    label: startup.name,
  }));

  return (
    <div>
      <h1>{TITRE}</h1>
      <OpsRequestForm
        startupOptions={startupOptions}
        defaultValues={{
          tchapId: matrixId || user?.username || "",
          email,
          prenomNom: user?.fullname || "",
          // Le projet part pré-rempli avec les produits du membre : sans lui,
          // la colonne « Projet » du Grist arrivait vide chez l'équipe ops,
          // qui devait remonter à l'auteur pour situer la demande.
          projet: userStartups.map((startup) => startup.name).join(", "),
          // pré-rempli pour les demandes qui réclament un email
          emailCollaborateur: email,
          emailAssocier: email,
          emailsNotifier: email,
        }}
      />
    </div>
  );
}
