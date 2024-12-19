"use client"; // due to linkRegistry
import { fr } from "@codegouvfr/react-dsfr";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import school from "@gouvfr/dsfr/dist/artwork/pictograms/buildings/school.svg";
import document from "@gouvfr/dsfr/dist/artwork/pictograms/document/document.svg";
import community from "@gouvfr/dsfr/dist/artwork/pictograms/environment/human-cooperation.svg";
import locationFrance from "@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg";
import internet from "@gouvfr/dsfr/dist/artwork/pictograms/digital/internet.svg";
import { StaticImageData } from "next/image";

import { linkRegistry } from "@/utils/routes/registry";

export interface DashboardPageProps {
    surveyCookieValue: string | null;
}

const tools = [
    {
        title: "Matomo",
        description: "Analyse de traffic web",
        href: "https://stats.beta.gouv.fr",
    },
    {
        title: "GRIST",
        description: "Spreadsheets on steroïds",
        href: "https://grist.numerique.gouv.fr",
    },
    {
        title: "VaultWarden",
        description: "Gestionnaire de mots de passe",
        href: "https://vaultwarden.incubateur.net",
    },
    {
        title: "Visio",
        description: "Visio-conférences",
        href: "https://visio.numerique.gouv.fr",
    },
    {
        title: "Pad",
        description: "Pads partageables",
        href: "https://pad.numerique.gouv.fr",
    },
    {
        title: "France Transfert",
        description: "Envoi de fichiers sécurisé",
        href: "https://francetransfert.numerique.gouv.fr/upload",
    },
    {
        title: "Sentry",
        description: "Suivi des exceptions techniques",
        href: "https://sentry.incubateur.net",
    },
    {
        title: "UpDown.io",
        description: "Monitoring de disponibilité",
        href: "https://updown.io/p/8lotm",
    },
    {
        title: "DashLord",
        description: "Suivi des métriques techniques",
        href: "https://dashlord.incubateur.net",
    },
];

export function DashboardPage(props: DashboardPageProps) {
    return (
        <div className={fr.cx("fr-container", "fr-pb-6w")}>
            <h2>Gérer mon compte</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Ma fiche membre"
                        desc="Modifier ma mission en cours ou mes infos personnelles."
                        orientation="horizontal"
                        imageUrl={(document as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("account"),
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Fiches produit"
                        desc="Compléter ma fiche produit."
                        orientation="horizontal"
                        imageUrl={(document as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("startupList"),
                        }}
                    />
                </div>
            </div>
            <h2 className={fr.cx("fr-pt-4w")}>Actualités</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Formations"
                        desc="S'inscrire aux formations réservées à la communauté."
                        orientation="horizontal"
                        imageUrl={(school as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("formationList"),
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Évènements"
                        desc="Découvrir les évènements de la communauté."
                        orientation="horizontal"
                        imageUrl={(school as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("eventsList"),
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Newsletters"
                        desc="Consultez les dernières infolettres de la communauté"
                        orientation="horizontal"
                        imageUrl={(school as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("newsletters"),
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
                        desc="Explorer la communauté"
                        orientation="horizontal"
                        imageUrl={(community as StaticImageData).src}
                        linkProps={{
                            href: linkRegistry.get("community"),
                        }}
                    />
                </div>
                <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title="Observatoire"
                        desc="Consulter les informations anonymisées sur la communauté (TJM...)."
                        orientation="horizontal"
                        imageUrl={(locationFrance as StaticImageData).src}
                        linkProps={{
                            href: `${linkRegistry.get("metabase")}`,
                        }}
                    />
                </div>
            </div>
            <h2 className={fr.cx("fr-pt-4w")}>Outils</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                {tools.map((tool) => (
                    <div
                        key={tool.title}
                        className={fr.cx("fr-col-12", "fr-col-lg-4")}
                    >
                        <Tile
                            className={fr.cx("fr-tile--sm")}
                            title={tool.title}
                            desc={tool.description}
                            orientation="horizontal"
                            imageUrl={(internet as StaticImageData).src}
                            linkProps={{
                                href: tool.href,
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
