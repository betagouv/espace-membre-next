"use client";

import { useEffect, useRef } from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";

import { copyToClipboard } from "@/lib/copyToClipBoard";

/**
 * Le jeton n'existe que dans l'etat local du formulaire parent : un
 * rechargement de page le perd definitivement. Ce composant vide cet etat au
 * demontage, ce qui rend l'affichage unique structurel et pas seulement
 * declaratif.
 *
 * Le nettoyage passe par une ref et un effet a dependances VIDES. Le mettre
 * directement en dependance (`useEffect(() => onDismiss, [onDismiss])`) le
 * rejouerait a chaque rendu, puisque le parent passe une fleche recreee a
 * chaque fois : le nettoyage EST l'effacement, donc le jeton disparaitrait
 * avant d'avoir pu etre copie, immediatement en mode strict.
 */
export const ApiKeyReveal = ({
  token,
  onDismiss,
}: {
  token: string;
  onDismiss: () => void;
}) => {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  // L'effacement est DIFFERE d'un tick, et annule si un setup le suit. C'est ce
  // qui distingue le demontage simule de StrictMode, qui joue setup, cleanup,
  // setup dans le meme cycle, d'un vrai demontage, ou aucun setup ne suit.
  // Sans ce report, le cleanup du premier setup vidait le jeton au montage meme
  // et l'alerte disparaissait avant d'avoir ete lue : en developpement le jeton
  // n'etait pas affiche « une seule fois », il ne l'etait jamais.
  useEffect(() => {
    if (pending.current) {
      clearTimeout(pending.current);
      pending.current = null;
    }
    return () => {
      pending.current = setTimeout(() => dismiss.current(), 0);
    };
  }, []);

  return (
    <Alert
      severity="success"
      title="Clef créée : copie-la maintenant"
      description={
        <>
          <p>
            Ce jeton ne sera plus jamais affiché. Il n&apos;est pas stocké en
            clair et personne ne peut le retrouver.
          </p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            <code>{token}</code>
          </pre>
          <Button
            type="button"
            onClick={() =>
              copyToClipboard(
                token,
                "La clef a été copiée dans le presse-papier",
              )
            }
          >
            Copier la clef
          </Button>
        </>
      }
    />
  );
};
