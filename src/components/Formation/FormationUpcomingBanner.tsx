"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
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

const CARTE = 15; // largeur d'une carte, en rem

/** Voile dégradé au bord de la piste, du côté où il reste des cartes. */
const Degrade = ({ cote }: { cote: "left" | "right" }) => (
  <span
    aria-hidden
    style={{
      position: "absolute",
      top: 0,
      bottom: 0,
      [cote]: "-0.25rem",
      width: "3rem",
      pointerEvents: "none",
      background: `linear-gradient(to ${cote}, transparent, var(--background-alt-blue-france))`,
    }}
  />
);

/**
 * Bandeau des prochaines formations auxquelles on est inscrit·e.
 *
 * Le catalogue affiche une carte par date : il s'allonge d'autant, et
 * retrouver ses propres séances y demanderait de tout parcourir. Le bandeau les
 * rassemble en tête, sur une seule ligne qui défile, pour ne pas prendre la
 * hauteur due au catalogue.
 */
export const FormationUpcomingBanner = ({
  formations,
}: {
  formations: ProchaineFormation[];
}) => {
  const piste = React.useRef<HTMLDivElement>(null);
  const [debut, setDebut] = React.useState(true);
  const [fin, setFin] = React.useState(false);

  // L'état des flèches suit le défilement : une flèche qui ne mène nulle part
  // est désactivée plutôt que de rester cliquable sans effet.
  const majBornes = React.useCallback(() => {
    const cadre = piste.current;
    if (!cadre) return;
    const reste = cadre.scrollWidth - cadre.clientWidth - cadre.scrollLeft;
    // Marge de quelques pixels : le retrait laissé pour les ombres portées
    // empêche le défilement d'atteindre exactement 0 ou le maximum.
    const MARGE = 8;
    setDebut(cadre.scrollLeft <= MARGE);
    setFin(reste <= MARGE);
  }, []);

  React.useEffect(() => {
    majBornes();
    const cadre = piste.current;
    if (!cadre) return;
    cadre.addEventListener("scroll", majBornes, { passive: true });
    window.addEventListener("resize", majBornes);
    return () => {
      cadre.removeEventListener("scroll", majBornes);
      window.removeEventListener("resize", majBornes);
    };
  }, [majBornes, formations.length]);

  const defiler = (sens: 1 | -1) => {
    const cadre = piste.current;
    if (!cadre) return;
    // Défilement sans animation : `behavior: "smooth"`, en CSS comme en
    // JavaScript, reste sans effet sur certains moteurs, où les flèches
    // paraissaient alors mortes. Un saut net vaut mieux qu'un bouton inerte.
    cadre.scrollBy({ left: sens * cadre.clientWidth * 0.8 });
    // Le défilement se faisant sans animation, la position est déjà à jour :
    // on recalcule les bornes sans attendre l'évènement `scroll`, que certains
    // moteurs n'émettent pas.
    majBornes();
  };

  if (formations.length === 0) return null;

  return (
    <section
      aria-labelledby="mes-formations"
      className={fr.cx("fr-p-3w", "fr-mb-4w")}
      style={{
        background: "var(--background-alt-blue-france)",
        borderRadius: "0.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <h2
          id="mes-formations"
          className={fr.cx("fr-h6", "fr-mb-0")}
          style={{ color: "var(--text-title-blue-france)" }}
        >
          Mes prochaines formations
        </h2>
        {formations.length > 1 && (
          <span style={{ display: "flex", gap: "0.25rem", flex: "0 0 auto" }}>
            <button
              type="button"
              aria-label="Voir les formations précédentes"
              disabled={debut}
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
              aria-label="Voir les formations suivantes"
              disabled={fin}
              onClick={() => defiler(1)}
              className={fr.cx(
                "fr-btn",
                "fr-btn--tertiary",
                "fr-btn--sm",
                "fr-icon-arrow-right-s-line",
              )}
            />
          </span>
        )}
      </div>

      <div style={{ position: "relative" }}>
        <div
          ref={piste}
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: "1rem",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            // Laisse la place aux ombres portées, qu'un débordement masqué
            // rognerait.
            padding: "0.25rem",
            margin: "-0.25rem",
            scrollbarWidth: "none",
          }}
        >
          {formations.map((formation) => (
            <Link
              key={`${formation.formationId}-${formation.sessionId}`}
              href={`/formations/${formation.formationId}`}
              className={fr.cx("fr-card--no-arrow")}
              style={{
                scrollSnapAlign: "start",
                flex: `0 0 ${CARTE}rem`,
                display: "flex",
                flexDirection: "column",
                background: "var(--background-default-grey)",
                borderRadius: "0.5rem",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0, 0, 18, 0.16)",
                backgroundImage: "none",
                textDecoration: "none",
              }}
            >
              {!!formation.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formation.imageUrl}
                  alt=""
                  loading="lazy"
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    objectFit: "cover",
                    display: "block",
                    background: "var(--background-alt-grey)",
                  }}
                />
              )}
              <div
                className={fr.cx("fr-p-2w")}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  flex: "1 1 auto",
                }}
              >
                {/* h3 : chaque formation du bandeau est un élément sous
                    « Mes prochaines formations », au même niveau que les
                    cartes du catalogue. La taille reste celle du texte. */}
                <h3
                  className={fr.cx("fr-text--md", "fr-mb-0")}
                  style={{
                    color: "var(--text-action-high-blue-france)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: "1.5rem",
                    minHeight: "3rem",
                  }}
                >
                  {formation.titre}
                </h3>
                <span
                  className={fr.cx("fr-text--sm", "fr-mb-0")}
                  style={{ color: "var(--text-mention-grey)" }}
                >
                  {formation.start
                    ? // Fuseau explicite : le serveur tourne en UTC, le
                      // navigateur à Paris.
                      formatInTimeZone(
                        formation.start,
                        "Europe/Paris",
                        "EEEE d MMMM, HH'h'mm",
                        { locale: frLocale },
                      )
                    : "Date à préciser"}
                </span>
                <span
                  className={fr.cx("fr-text--xs", "fr-mb-0", "fr-mt-1v")}
                  style={{
                    alignSelf: "flex-start",
                    padding: "0.125rem 0.5rem",
                    borderRadius: "1rem",
                    fontWeight: 700,
                    color: formation.onWaitingList
                      ? "var(--text-default-grey)"
                      : "var(--text-default-success)",
                    background: formation.onWaitingList
                      ? "var(--background-contrast-grey)"
                      : "var(--background-contrast-success)",
                  }}
                >
                  {formation.onWaitingList ? "Liste d'attente" : "Inscrit·e"}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Un dégradé de chaque côté annonce les cartes hors champ : sans lui,
            celles que la piste tranche semblent coupées par accident. */}
        {!debut && <Degrade cote="left" />}
        {!fin && <Degrade cote="right" />}
      </div>
    </section>
  );
};
