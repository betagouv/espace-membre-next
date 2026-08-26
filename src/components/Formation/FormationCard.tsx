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
  if (!!formation.isELearning) {
    badges.push(
      <Badge key={"e-learning"} severity="new" as="span">
        E-learning
      </Badge>,
    );
  }

  // imageUrl et imageAlt forment une union dans le type du composant : les deux
  // ou aucun. Et une chaîne vide vaut 0 dans son `imageUrl.length && ...`
  // interne, qui afficherait « 0 » sur la carte.
  const imageProps:
    | { imageUrl: string; imageAlt: string }
    | { imageUrl?: never; imageAlt?: never } = formation.imageUrl
    ? { imageUrl: formation.imageUrl, imageAlt: "" }
    : {};

  // Une formation peut être programmée plusieurs fois. La carte annonce la date
  // la plus proche ; le reste se voit sur la page de la formation.
  const autresDates = Math.max(0, (formation.sessions?.length ?? 0) - 1);

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
      endDetail={
        formation.start
          ? // Fuseau explicite : sans lui, le serveur (UTC en conteneur) et le
            // navigateur (Paris) affichent deux heures différentes, et React
            // signale une erreur d'hydratation.
            `${formatInTimeZone(
              formation.start,
              "Europe/Paris",
              "d MMMM à HH'h'mm",
              { locale: fr },
            )}${autresDates ? ` (+ ${autresDates} autre${autresDates > 1 ? "s" : ""} date${autresDates > 1 ? "s" : ""})` : ""}`
          : undefined
      }
    ></Card>
  );
}
