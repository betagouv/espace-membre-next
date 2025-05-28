import { fr } from "@codegouvfr/react-dsfr/fr";
import Tile from "@codegouvfr/react-dsfr/Tile";
import dataviz from "@gouvfr/dsfr/dist/artwork/pictograms/digital/data-visualization.svg";
import map from "@gouvfr/dsfr/dist/artwork/pictograms/map/map.svg";
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
