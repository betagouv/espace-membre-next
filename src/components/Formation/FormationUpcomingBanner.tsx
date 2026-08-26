"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { formatInTimeZone } from "date-fns-tz";
import { fr as frLocale } from "date-fns/locale/fr";
import Link from "next/link";

export type ProchaineFormation = {
  formationId: string;
  sessionId: string;
  titre: string;
  imageUrl?: string;
  start?: Date;
  onWaitingList: boolean;
};

/**
 * Bandeau des prochaines formations auxquelles on est inscrit·e.
 *
 * Le catalogue est long : sans ce rappel, retrouver ses propres inscriptions
 * demanderait de parcourir toutes les cartes. Les séances défilent
 * horizontalement plutôt que d'occuper la hauteur due au catalogue.
 */
export const FormationUpcomingBanner = ({
  formations,
}: {
  formations: ProchaineFormation[];
}) => {
  const piste = React.useRef<HTMLDivElement>(null);

  const defiler = (sens: 1 | -1) => {
    const cadre = piste.current;
    if (!cadre) return;
    // Défilement sans animation : `behavior: "smooth"`, en CSS comme en
    // JavaScript, reste sans effet sur certains moteurs, où la flèche
    // paraissait alors morte. Un saut net vaut mieux qu'un bouton inerte.
    cadre.scrollBy({ left: sens * cadre.clientWidth * 0.8 });
  };

  if (formations.length === 0) return null;

  return (
    <section className={fr.cx("fr-mb-4w")} aria-labelledby="mes-formations">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <h2 id="mes-formations" className={fr.cx("fr-h5", "fr-mb-1w")}>
          Mes prochaines formations
        </h2>
        {/* Les flèches ne servent qu'au confort : la piste se fait défiler à la
            main, au doigt comme à la molette. */}
        {formations.length > 1 && (
          <span>
            <button
              type="button"
              aria-label="Faire défiler vers la gauche"
              onClick={() => defiler(-1)}
              className={fr.cx(
                "fr-btn",
                "fr-btn--tertiary",
                "fr-btn--sm",
                "fr-icon-arrow-left-s-line",
              )}
            />
            <button
              type="button"
              aria-label="Faire défiler vers la droite"
              onClick={() => defiler(1)}
              className={fr.cx(
                "fr-btn",
                "fr-btn--tertiary",
                "fr-btn--sm",
                "fr-icon-arrow-right-s-line",
                "fr-ml-1v",
              )}
            />
          </span>
        )}
      </div>

      <div
        ref={piste}
        style={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: "0.5rem",
        }}
      >
        {formations.map((formation) => (
          <Link
            key={`${formation.formationId}-${formation.sessionId}`}
            href={`/formations/${formation.formationId}`}
            style={{
              scrollSnapAlign: "start",
              flex: "0 0 auto",
              width: "16rem",
              display: "flex",
              flexDirection: "column",
              border: "1px solid var(--border-default-grey)",
              borderRadius: "0.25rem",
              overflow: "hidden",
              backgroundImage: "none",
              textDecoration: "none",
            }}
          >
            {!!formation.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formation.imageUrl}
                alt=""
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}
            <span className={fr.cx("fr-p-2w")}>
              <strong style={{ display: "block" }}>{formation.titre}</strong>
              <span
                className={fr.cx("fr-text--sm")}
                style={{ display: "block" }}
              >
                {formation.start
                  ? // Fuseau explicite : le serveur tourne en UTC, le
                    // navigateur à Paris.
                    formatInTimeZone(
                      formation.start,
                      "Europe/Paris",
                      "EEEE d MMMM à HH'h'mm",
                      { locale: frLocale },
                    )
                  : "Date à préciser"}
              </span>
              <Badge
                as="span"
                small
                severity={formation.onWaitingList ? undefined : "success"}
                className={fr.cx("fr-mt-1v")}
              >
                {formation.onWaitingList ? "Liste d'attente" : "Inscrit"}
              </Badge>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
