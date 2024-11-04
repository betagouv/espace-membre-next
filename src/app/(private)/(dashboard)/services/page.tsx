import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import community from "@gouvfr/dsfr/dist/artwork/pictograms/environment/human-cooperation.svg";
import locationFrance from "@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg";
import { StaticImageData } from "next/image";

export default async function Page() {
    return (
        <div className={fr.cx("fr-container", "fr-pb-6w")}>
            <h2 className={fr.cx("fr-pt-4w")}>Demandes d'accès outils</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-6")}>
                    <Tile
                        small={true}
                        // className={fr.cx("fr-tile--sm")}
                        title="Matomo"
                        desc={
                            <Badge noIcon severity="success">
                                Compte existant
                            </Badge>
                        }
                        orientation="horizontal"
                        noIcon={true}
                        titleAs="h6"
                        imageUrl={(community as StaticImageData).src}
                        disabled={false}
                    />
                </div>
            </div>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-6")}>
                    <Tile
                        small={true}
                        className={fr.cx("fr-tile--sm")}
                        title="Sentry"
                        desc="Demander les accès à sentry"
                        orientation="horizontal"
                        imageUrl={(locationFrance as StaticImageData).src}
                        linkProps={{
                            href: `/admin/newsletters`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
