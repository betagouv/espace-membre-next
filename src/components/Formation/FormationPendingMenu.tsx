"use client";

import React from "react";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";

export type PendingFormation = {
  id: string;
  name: string;
  animator?: string;
};

/**
 * Propositions en attente de validation, pour l'équipe d'animation.
 *
 * Une formation proposée n'est pas au catalogue : sans ce menu, rien
 * n'indiquerait qu'il y a quelque chose à examiner. Le compteur évite d'avoir
 * à déplier pour le savoir.
 *
 * Le panneau se place sous l'ensemble du groupe de boutons : il compte sur le
 * conteneur parent pour être positionné.
 */
export const FormationPendingMenu = ({
  formations,
}: {
  formations: PendingFormation[];
}) => {
  const [open, setOpen] = React.useState(false);

  if (formations.length === 0) return null;

  return (
    <>
      <Button
        priority="secondary"
        iconId={open ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}
        iconPosition="right"
        nativeButtonProps={{
          type: "button",
          "aria-expanded": open,
          "aria-label": `${formations.length} formation${
            formations.length > 1 ? "s" : ""
          } en attente de validation`,
          onClick: () => setOpen((wasOpen) => !wasOpen),
        }}
        // Collé au bouton voisin : les deux bordures se confondent, l'ensemble
        // se lit comme un seul contrôle.
        style={{ marginLeft: -1 }}
      >
        {formations.length}
      </Button>

      {open && (
        <div
          className={fr.cx("fr-p-2w")}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            zIndex: 10,
            minWidth: 320,
            maxWidth: "min(28rem, 90vw)",
            background: "var(--background-default-grey)",
            boxShadow: "var(--overlap-shadow, 0 2px 6px rgba(0,0,0,.2))",
          }}
        >
          <p className={fr.cx("fr-text--sm", "fr-mb-1w")}>
            <strong>En attente de validation</strong>
          </p>
          <ul className={fr.cx("fr-mb-0")}>
            {formations.map((formation) => (
              <li key={formation.id}>
                <Link
                  href={`/formations/${formation.id}`}
                  onClick={() => setOpen(false)}
                >
                  {formation.name}
                </Link>
                {!!formation.animator && (
                  <span className={fr.cx("fr-hint-text")}>
                    {formation.animator}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};
