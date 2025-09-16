import { fr } from "@codegouvfr/react-dsfr/fr";
import Tile from "@codegouvfr/react-dsfr/Tile";
import dataviz from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/digital/data-visualization.svg";
import { StaticImageData } from "next/image";

import { linkRegistry } from "@/utils/routes/registry";

export const Footer = () => (
  <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
    <div className={fr.cx("fr-col-12", "fr-col-lg-12")}>
      <Tile
        className={fr.cx("fr-tile--sm")}
        title="Observatoire de la communauté"
        desc="Consulter les stats"
        orientation="horizontal"
        imageUrl={(dataviz as StaticImageData).src}
        linkProps={{
          href: linkRegistry.get("metabase"),
        }}
      />
    </div>
  </div>
);
