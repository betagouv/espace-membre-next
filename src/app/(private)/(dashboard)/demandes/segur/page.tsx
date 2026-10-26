import { fr } from "@codegouvfr/react-dsfr";
import cityHall from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/buildings/city-hall.svg";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import { Metadata } from "next";
import { StaticImageData } from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/authoptions";
import { routes, routeTitles } from "@/lib/routes";

export const metadata: Metadata = {
  title: `${routeTitles.segurRequests()} / Espace Membre`,
};

// Point d'entrée des demandes Ségur : une tuile par type de demande, chacune
// menant à son propre formulaire.
export default async function SegurRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>{routeTitles.segurRequests()}</h1>
      <p className="fr-text--sm">
        Les membres de la communauté beta.gouv.fr peuvent travailler
        ponctuellement dans l'open space de la DINUM (20 avenue de Ségur, Paris)
        et y réserver une salle de réunion. Choisis ta demande.
      </p>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
          <Tile
            className={fr.cx("fr-tile--sm")}
            title="Accès à Ségur"
            desc="Demander un accès aux bureaux du bâtiment Ségur."
            orientation="horizontal"
            imageUrl={(cityHall as StaticImageData).src}
            linkProps={{
              href: routes.segurAccessRequest(),
            }}
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
          <Tile
            className={fr.cx("fr-tile--sm")}
            title="Salle de réunion à Ségur"
            desc="Réserver une salle de réunion dans le bâtiment Ségur."
            orientation="horizontal"
            imageUrl={(cityHall as StaticImageData).src}
            linkProps={{
              href: routes.segurMeetingRoomRequest(),
            }}
          />
        </div>
      </div>
    </div>
  );
}
