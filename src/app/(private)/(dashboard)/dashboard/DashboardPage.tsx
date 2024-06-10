"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import { StaticImageData } from "next/image";
import locationFrance from "@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg";
import document from "@gouvfr/dsfr/dist/artwork/pictograms/document/document.svg";
import mailSend from "@gouvfr/dsfr/dist/artwork/pictograms/digital/mail-send.svg";
import school from "@gouvfr/dsfr/dist/artwork/pictograms/buildings/school.svg";
import { linkRegistry } from "@/utils/routes/registry";

export interface DashboardPageProps {
    params: {};
}

export function DashboardPage(props: DashboardPageProps) {
    return (
        <div className={fr.cx("fr-container", "fr-pb-6w")}>
            <h2>Gérer mon compte</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Ma fiche membre"
                        desc="Modifier ma mission en cours ou mes infos personnelles."
                        horizontal
                        imageUrl={(document as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get(
                                "accountEditBaseInfo",
                                undefined
                            ),
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Email"
                        desc="Configurer l'accès à mes emails."
                        horizontal
                        imageUrl={(mailSend as StaticImageData).src}
                        linkProps={{
                            href: `${linkRegistry.get(
                                "account",
                                undefined
                            )}#email-settings`,
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Fiches produit"
                        desc="Compléter ma fiche produit."
                        horizontal
                        imageUrl={(document as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("startupList", undefined),
                        }}
                    />
                </div>
            </div>
            <h2 className={fr.cx("fr-pt-4w")}>Explorer la communauté</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Communauté"
                        desc="Modifier ma mission en cours ou mes infos personnelles."
                        horizontal
                        imageUrl={(mailSend as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("community", undefined),
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Observatoire de la communauté"
                        desc="Consulter les informations anonymisées sur la communauté (TJM...)."
                        horizontal
                        imageUrl={(locationFrance as StaticImageData).src}
                        linkProps={{
                            href: `${linkRegistry.get(
                                "account",
                                undefined
                            )}#observatory`,
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Formations"
                        desc="S'inscrire aux formations réservées à la communauté."
                        horizontal
                        imageUrl={(school as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("formationList", undefined),
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Actualités"
                        desc="Lire les dernières infolettres de la communauté."
                        horizontal
                        imageUrl={(mailSend as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("newsletters", undefined),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
