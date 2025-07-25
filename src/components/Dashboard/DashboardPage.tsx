"use client";
import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import { Tile } from "@codegouvfr/react-dsfr/Tile";
import school from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/buildings/school.svg";
import avatar from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/digital/avatar.svg";
import calendar from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/digital/calendar.svg";
import internet from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/digital/internet.svg";
import emailpicto from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/digital/mail-send.svg";
import document from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/document/document.svg";
import community from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/environment/human-cooperation.svg";
import locationFrance from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/map/location-france.svg";
import { StaticImageData } from "next/image";
import Link from "next/link";

import ProgressBar from "../ProgressBar";
import { getLatests as getLatestsProducts } from "@/lib/kysely/queries/startups";
import { getLatests as getLatestsMembers } from "@/lib/kysely/queries/users";
import { linkRegistry } from "@/utils/routes/registry";

type LatestProductsReturnType = Awaited<ReturnType<typeof getLatestsProducts>>;
type LatestMembersReturnType = Awaited<ReturnType<typeof getLatestsMembers>>;

export interface DashboardPageProps {
  surveyCookieValue: string | null;
  latestProducts: LatestProductsReturnType;
  latestMembers: LatestMembersReturnType;
  onboarding?: {
    progress: number;
  };
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
    enlargeLinkOrButton={true}
    orientation="horizontal"
    linkProps={{
      href: linkRegistry.get("startupDetails", {
        startupId: product.uuid,
      }),
    }}
    start={
      <Badge noIcon severity="error" as="span">
        {product.incubator}
      </Badge>
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
      <span style={{ display: "flex", flexDirection: "column" }}>
        {member.startups.map((s) => (
          <span key={s.uuid} className={fr.cx("fr-mb-1v")}>
            <Badge noIcon severity="info" as="span">
              {s.name}
            </Badge>
          </span>
        ))}
      </span>
    }
    enlargeLinkOrButton={true}
    orientation="horizontal"
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
      {props.onboarding && (
        <div
          style={{ border: "1px solid #ccc", padding: "20px" }}
          className={fr.cx("fr-container", "fr-mb-6w")}
        >
          <h3>Mon arrivée chez beta.gouv.fr</h3>
          <ProgressBar progress={props.onboarding.progress} />
          <div className={fr.cx("fr-mt-3w")}>
            <Link
              href={`${linkRegistry.get("account")}?tab=embarquement`}
              className={fr.cx(
                "fr-link",
                "fr-icon-arrow-right-line",
                "fr-link--icon-right",
              )}
            >
              Continuer mon embarquement
            </Link>
          </div>
        </div>
      )}
      <h2>Gérer mon compte</h2>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
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
        <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
          <Tile
            className={fr.cx("fr-tile--sm")}
            title="Fiches produit"
            desc="Compléter ma fiche produit"
            orientation="horizontal"
            imageUrl={(internet as StaticImageData).src}
            linkProps={{
              href: linkRegistry.get("startupList"),
            }}
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
          <Tile
            className={fr.cx("fr-tile--sm")}
            title="Nouveau membre"
            desc="Créer une nouvelle fiche membre"
            orientation="horizontal"
            imageUrl={(avatar as StaticImageData).src}
            linkProps={{
              href: linkRegistry.get("communityCreateMember"),
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
            imageUrl={(calendar as StaticImageData).src}
            linkProps={{
              href: linkRegistry.get("eventsList"),
            }}
          />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-lg-4")}>
          <Tile
            className={fr.cx("fr-tile--sm")}
            title="Actualités"
            desc="Lire les dernières infolettres de la communauté"
            orientation="horizontal"
            imageUrl={(emailpicto as StaticImageData).src}
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
      <div
        className={fr.cx(
          "fr-grid-row",
          "fr-grid-row--gutters",
          "fr-mt-6w",
          "fr-px-6w",
        )}
        style={{
          background: "linear-gradient( #ececfe, #f5f5fe )",
        }}
      >
        <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
          <h2 className={fr.cx("fr-pt-4w")}>Nouveaux produits</h2>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {props.latestProducts.slice(0, 5).map((p) => (
              <div key={p.uuid} className={fr.cx("fr-col-12")}>
                <CardProduct product={p} />
              </div>
            ))}
            <div className={fr.cx("fr-col-12")}>
              <Button
                priority="secondary"
                linkProps={{
                  href: linkRegistry.get("startupList"),
                }}
              >
                Explorer les produits →
              </Button>
            </div>
          </div>
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
          <h2 className={fr.cx("fr-pt-4w")}>Nouveaux membres</h2>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {props.latestMembers.slice(0, 5).map((m) => (
              <div key={m.uuid} className={fr.cx("fr-col-12")}>
                <CardMember member={m} />
              </div>
            ))}
            <div className={fr.cx("fr-col-12")}>
              <Button
                priority="secondary"
                linkProps={{
                  href: linkRegistry.get("community"),
                }}
              >
                Explorer les membres →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
