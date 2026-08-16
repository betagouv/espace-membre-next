"use client";

import Script from "next/script";
import { useCallback } from "react";

/**
 * Documentation interactive, servie comme une PAGE et non comme une route d'API :
 * elle hérite ainsi de l'en-tête, du pied de page et du thème du layout racine,
 * au lieu d'être une chaîne HTML isolée.
 *
 * Le chemin `/api/docs` n'est pas sous `/api/v1/`, donc le middleware ne le
 * reconnaît pas comme public : il est exclu à la main du `config.matcher`, sans
 * quoi la page répondrait 401 JSON, et pas même une redirection vers /login,
 * puisque le chemin commence par `/api/`.
 */

// Épinglé sur le MAJEUR : le bundle est résolu par le navigateur à chaque
// visite, pas figé au build. Sans épinglage, une version majeure publiée demain
// changerait une page publique sans qu'aucun déploiement n'ait eu lieu.
const SCALAR_BUNDLE =
  "https://unpkg.com/@scalar/api-reference@1/dist/browser/standalone.js";

const MOUNT_ID = "scalar-api-reference";

// `sources` prépare le sélecteur de version. Scalar ne le monte qu'à partir de
// DEUX documents : avec la seule v1 il n'apparaît pas, seule la plomberie est en
// place. Elle impose l'appel direct à `createApiReference` : par l'ancien canal
// du jeu de données HTML, le réducteur de schéma ne recopie que les propriétés
// déclarées, et `sources` n'en est pas, elle serait donc supprimée en silence.
const CONFIGURATION = {
  withDefaultFonts: false,
  sources: [
    { slug: "v1", title: "v1", url: "/api/v1/openapi.json", default: true },
  ],
  // Share et Deploy sont les deux enfants du panneau Developer Tools, une seule
  // option les éteint. Son défaut vaut "localhost", donc la barre n'apparaissait
  // déjà pas en production, mais la détection d'hôte retombe sur « afficher »
  // quand l'URL n'est pas analysable.
  showDeveloperTools: "never",
  // « Powered by Scalar » n'a aucune option, à aucun palier commercial : le lien
  // est rendu sans condition, le CSS est la seule voie. Les deux sélecteurs
  // s'appuient sur une classe littérale et un href, jamais sur le `data-v-*`
  // voisin, qui est un hash de build.
  customCss:
    ".api-reference-toolbar{display:none!important}" +
    " .darklight-reference a[href='https://www.scalar.com']{display:none!important}",
};

type ScalarGlobal = {
  createApiReference: (target: string, configuration: unknown) => void;
};

export default function ApiDocsPage() {
  const mount = useCallback(() => {
    const scalar = (window as unknown as { Scalar?: ScalarGlobal }).Scalar;
    scalar?.createApiReference(`#${MOUNT_ID}`, CONFIGURATION);
  }, []);

  return (
    <>
      <div id={MOUNT_ID} />
      <Script src={SCALAR_BUNDLE} strategy="afterInteractive" onReady={mount} />
    </>
  );
}
