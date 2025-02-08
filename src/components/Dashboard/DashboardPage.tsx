"use client";
import { fr } from "@codegouvfr/react-dsfr";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import school from "@gouvfr/dsfr/dist/artwork/pictograms/buildings/school.svg";
import document from "@gouvfr/dsfr/dist/artwork/pictograms/document/document.svg";
import community from "@gouvfr/dsfr/dist/artwork/pictograms/environment/human-cooperation.svg";
import locationFrance from "@gouvfr/dsfr/dist/artwork/pictograms/map/location-france.svg";
import startupIcon from "@gouvfr/dsfr/dist/artwork/pictograms/system/success.svg";
import memberIcon from "@gouvfr/dsfr/dist/artwork/pictograms/digital/avatar.svg";
import { StaticImageData } from "next/image";

import { SurveyBox } from "@/components/SurveyBox";
import { linkRegistry } from "@/utils/routes/registry";
import { getLatests as getLatestsProducts } from "@/lib/kysely/queries/startups";
import { getLatests as getLatestsMembers } from "@/lib/kysely/queries/users";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Link from "next/link";

type LatestProductsReturnType = Awaited<ReturnType<typeof getLatestsProducts>>;
type LatestMembersReturnType = Awaited<ReturnType<typeof getLatestsMembers>>;

export interface DashboardPageProps {
    surveyCookieValue: string | null;
    latestProducts: LatestProductsReturnType;
    latestMembers: LatestMembersReturnType;
}

const CardProduct = ({
    product,
}: {
    product: LatestProductsReturnType[number];
}) => (
    <Tile
        className={fr.cx("fr-tile--sm")}
        title={product.name}
        desc={product.pitch}
        enlargeLinkOrButton={false}
        orientation="horizontal"
        imageUrl={(startupIcon as StaticImageData).src}
        linkProps={{
            href: linkRegistry.get("startupDetails", {
                startupId: product.uuid,
            }),
        }}
        detail={
            <Link href={`/incubators/${product.incubatorUuid}`}>
                <Badge noIcon severity="info" as="span">
                    {product.incubator}
                </Badge>
            </Link>
        }
    />
);

const CardMember = ({
    member,
}: {
    member: LatestMembersReturnType[number];
}) => (
    <Tile
        key={member.uuid}
        className={fr.cx("fr-tile--sm")}
        title={member.fullname}
        desc={
            <>
                {member.role}
                <br />
                <span
                    style={{ display: "block" }}
                    className={fr.cx("fr-text--light", "fr-mb-1w")}
                >
                    {member.bio}
                </span>
            </>
        }
        start={
            <Badge noIcon severity="new" as="span">
                Domaine: {member.domaine}
            </Badge>
        }
        detail={
            <span style={{ display: "flex", flexDirection: "column" }}>
                {member.startups.map((s) => (
                    <span key={s.uuid} className={fr.cx("fr-mb-1v")}>
                        <Link href={`/startups/${s.uuid}`}>
                            <Badge noIcon severity="info" as="span">
                                {s.name}
                            </Badge>
                        </Link>
                    </span>
                ))}
            </span>
        }
        enlargeLinkOrButton={false}
        orientation="horizontal"
        imageUrl={member.avatar || (memberIcon as StaticImageData).src}
        linkProps={{
            href: linkRegistry.get("communityMember", {
                username: member.username,
            }),
        }}
    />
);

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
            <h2 className={fr.cx("fr-pt-4w")}>Les derniers produits</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                {props.latestProducts.slice(0, 6).map((p) => (
                    <div
                        key={p.uuid}
                        className={fr.cx("fr-col-12", "fr-col-lg-6")}
                    >
                        <CardProduct product={p} />
                    </div>
                ))}
                <div className={fr.cx("fr-col-12")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title={"Tous les produits"}
                        desc={"Découvrir tous les produits"}
                        enlargeLinkOrButton={true}
                        imageUrl={(document as StaticImageData).src}
                        orientation="horizontal"
                        linkProps={{
                            href: linkRegistry.get("startupList"),
                        }}
                    />
                </div>
            </div>
            <h2 className={fr.cx("fr-pt-4w")}>Les derniers membres</h2>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                {props.latestMembers.slice(0, 16).map((m) => (
                    <div
                        key={m.uuid}
                        className={fr.cx("fr-col-12", "fr-col-lg-4")}
                    >
                        <CardMember member={m} />
                    </div>
                ))}
                <div className={fr.cx("fr-col-12")}>
                    <Tile
                        className={fr.cx("fr-tile--sm")}
                        title={"Tous les membres"}
                        desc={"Découvrir tous les membres"}
                        imageUrl={(community as StaticImageData).src}
                        enlargeLinkOrButton={true}
                        orientation="horizontal"
                        linkProps={{
                            href: linkRegistry.get("community"),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
