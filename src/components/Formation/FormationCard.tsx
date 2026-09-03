import { ReactNode } from "react";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale/fr";

import { Formation } from "@/models/formation";

export default function FormationCard({
  formation,
  isMemberRegistered,
  isMemberOnWaitingList,
}: {
  formation: Formation;
  isMemberRegistered: boolean;
  isMemberOnWaitingList: boolean;
}) {
  let badges: ReactNode[] = [];
  if (isMemberRegistered) {
    if (!isMemberOnWaitingList) {
      badges.push(
        <ul className="fr-badges-group">
          <li>
            <Badge severity="success" as="span">
              Inscrit
            </Badge>
          </li>
        </ul>,
      );
    } else {
      badges.push(
        <ul className="fr-badges-group">
          <li>
            <Badge as="span">Inscrit sur liste d'attente</Badge>
          </li>
        </ul>,
      );
    }
  }

  // imageUrl et imageAlt forment une union dans le type du composant : les deux
  // ou aucun. Et une chaîne vide vaut 0 dans son `imageUrl.length && ...`
  // interne, qui afficherait « 0 » sur la carte.
  const imageProps:
    | { imageUrl: string; imageAlt: string }
    | { imageUrl?: never; imageAlt?: never } = formation.imageUrl
    ? { imageUrl: formation.imageUrl, imageAlt: "" }
    : {};

  return (
    <Card
      background
      border
      desc={
        <span
          style={{
            overflowWrap: "break-word",
          }}
        >
          {formation.description}
        </span>
      }
      enlargeLink
      {...imageProps}
      linkProps={{
        href: `/formations/${formation.airtable_id}`,
      }}
      // Un tableau vide vaut 0 dans le `length && ...` interne du composant,
      // qui afficherait « 0 » sur la carte.
      start={badges.length ? badges : undefined}
      size="medium"
      title={formation.name}
      titleAs="h2"
      // Le bas de la carte dit « quand » : une date pour une séance, la
      // pastille pour un e-learning qui n'en a pas. En haut, elle passait pour
      // un état du membre, à côté de « Inscrit ».
      end={
        formation.isELearning ? (
          <ul className="fr-badges-group">
            <li>
              <Badge severity="new" as="span">
                E-learning
              </Badge>
            </li>
          </ul>
        ) : undefined
      }
      endDetail={
        formation.start
          ? // Fuseau explicite : sans lui, le serveur (UTC en conteneur) et le
            // navigateur (Paris) affichent deux heures différentes, et React
            // signale une erreur d'hydratation.
            formatInTimeZone(
              formation.start,
              "Europe/Paris",
              "d MMMM à HH'h'mm",
              {
                locale: fr,
              },
            )
          : undefined
      }
    ></Card>
  );
}
