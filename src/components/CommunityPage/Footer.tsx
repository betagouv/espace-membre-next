import { fr } from "@codegouvfr/react-dsfr/fr";
import DataVisualization from "@codegouvfr/react-dsfr/picto/DataVisualization";
import Tile from "@codegouvfr/react-dsfr/Tile";

import { routes } from "@/utils/routes/routes";

export const Footer = () => (
  <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
    <div className={fr.cx("fr-col-12", "fr-col-lg-12")}>
      <Tile
        className={fr.cx("fr-tile--sm")}
        title="Observatoire de la communauté"
        desc="Consulter les stats"
        orientation="horizontal"
        pictogram={<DataVisualization />}
        linkProps={{
          href: routes["metabase"](),
        }}
      />
    </div>
  </div>
);
