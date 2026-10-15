"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";

import { FormationImage } from "@/lib/formationsGrist";

/**
 * Choix d'une illustration dans la banque du document.
 *
 * La banque compte plusieurs dizaines d'images : sans filtre ni hauteur
 * bornée, elle occuperait la moitié du formulaire. Les catégories servent de
 * tri, et la grille défile dans son propre cadre.
 */
export const FormationImagePicker = ({
  images,
  value,
  onChange,
}: {
  images: FormationImage[];
  value?: string;
  onChange: (id: string) => void;
}) => {
  const [categorie, setCategorie] = React.useState<string>("");

  // Une illustration porte parfois plusieurs catégories, séparées par des
  // virgules côté Grist.
  const categories = React.useMemo(() => {
    const toutes = new Set<string>();
    for (const image of images) {
      for (const part of (image.categorie ?? "").split(",")) {
        const nette = part.trim();
        if (nette) toutes.add(nette);
      }
    }
    return [...toutes].sort((a, b) => a.localeCompare(b, "fr"));
  }, [images]);

  const visibles = categorie
    ? images.filter((image) =>
        (image.categorie ?? "")
          .split(",")
          .some((part) => part.trim() === categorie),
      )
    : images;

  if (images.length === 0) return null;

  return (
    <>
      {categories.length > 1 && (
        <ul className={fr.cx("fr-tags-group", "fr-mb-1w")}>
          <li>
            <button
              type="button"
              className={fr.cx("fr-tag")}
              aria-pressed={categorie === ""}
              onClick={() => setCategorie("")}
            >
              Toutes
            </button>
          </li>
          {categories.map((nom) => (
            <li key={nom}>
              <button
                type="button"
                className={fr.cx("fr-tag")}
                aria-pressed={categorie === nom}
                onClick={() => setCategorie(nom)}
              >
                {nom}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))",
          gap: "0.75rem",
          width: "100%",
          // La banque grandira : on borne sa hauteur plutôt que de laisser le
          // formulaire s'allonger sans fin.
          maxHeight: "26rem",
          overflowY: "auto",
          padding: "0.25rem",
        }}
      >
        {visibles.map((image) => {
          const choisie = value === image.id;
          return (
            <button
              type="button"
              key={image.id}
              aria-pressed={choisie}
              // Recliquer sur l'illustration choisie la retire : c'est le seul
              // moyen de revenir à l'envoi d'un fichier.
              title={choisie ? "Retirer cette illustration" : image.nom}
              onClick={() => onChange(choisie ? "" : image.id)}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                padding: 0,
                background: "var(--background-default-grey)",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "0.25rem",
                overflow: "hidden",
                // Un contour ne déplace pas la grille quand il s'épaissit,
                // contrairement à une bordure.
                outline: choisie
                  ? "3px solid var(--border-active-blue-france)"
                  : "1px solid var(--border-default-grey)",
                outlineOffset: choisie ? "-1px" : 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                loading="lazy"
                style={{
                  width: "100%",
                  aspectRatio: "16 / 10",
                  objectFit: "cover",
                  display: "block",
                  background: "var(--background-alt-grey)",
                }}
              />
              {choisie && (
                <span
                  className={fr.cx("fr-icon-check-line", "fr-icon--sm")}
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "0.25rem",
                    right: "0.25rem",
                    width: "1.5rem",
                    height: "1.5rem",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--background-default-grey)",
                    background: "var(--border-active-blue-france)",
                  }}
                />
              )}
              <span
                className={fr.cx(
                  "fr-text--xs",
                  "fr-px-1v",
                  "fr-py-1v",
                  "fr-mb-0",
                )}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  // Deux lignes réservées : les cartes gardent la même hauteur
                  // quelle que soit la longueur du nom.
                  minHeight: "2.75rem",
                  lineHeight: "1.25rem",
                }}
              >
                {image.nom}
              </span>
            </button>
          );
        })}
      </div>

      {visibles.length === 0 && (
        <p className={fr.cx("fr-hint-text")}>
          Aucune illustration dans cette catégorie.
        </p>
      )}
    </>
  );
};
