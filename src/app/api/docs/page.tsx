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
  // L'application force le thème clair (`src/dsfr-bootstrap/defaultColorScheme`).
  // Scalar, lui, retombe sur `system` et pose sa classe sur le `document.body`
  // PARTAGÉ : sur un poste en thème sombre, la doc virait au noir au milieu
  // d'une page claire. On l'aligne, et on retire la bascule pour qu'un visiteur
  // ne puisse pas les redésynchroniser d'un clic.
  forceDarkModeState: "light",
  hideDarkModeToggle: true,
  // « Powered by Scalar » n'a aucune option, à aucun palier commercial : le lien
  // est rendu sans condition, le CSS est la seule voie. Les deux sélecteurs
  // s'appuient sur une classe littérale et un href, jamais sur le `data-v-*`
  // voisin, qui est un hash de build.
  // « Ask AI » n'a pas d'option non plus, et son bouton ne porte aucune classe
  // propre. `t-doc__sidebar` est en revanche une classe littérale de Scalar, et
  // le bouton est le DERNIER de son conteneur, la recherche étant le premier :
  // sans `:last-child`, la règle emportait aussi la recherche, vérifié.
  customCss:
    ".api-reference-toolbar{display:none!important}" +
    " .darklight-reference a[href='https://www.scalar.com']{display:none!important}" +
    " .t-doc__sidebar button.bg-sidebar-b-search:last-child{display:none!important}",
};

/**
 * Deux corrections que la configuration de Scalar ne couvre pas.
 *
 * Le conteneur du layout racine plafonne à 1248px : une documentation d'API a
 * besoin de toute la largeur, sa navigation latérale et son panneau d'exemples
 * étant déjà deux colonnes.
 *
 * Il porte aussi `overflow: hidden`, ce qui NEUTRALISE le `position: sticky` de
 * la navigation latérale de Scalar : un `overflow` autre que `visible` sur un
 * ancêtre fait coller l'élément dans la boîte de défilement de cet ancêtre, or
 * celle-ci ne défile pas, c'est le document qui défile. Le menu suivait donc la
 * page au lieu de rester en vue. Il n'y a rien à corriger sur `top`, qui vaut 0
 * à juste titre : l'en-tête DSFR est en `position: relative` et disparaît au
 * défilement, la bascule est continue.
 *
 * Et les variables de Scalar sont mappées sur les tokens du DSFR, en dur : la
 * feuille du DSFR n'est pas chargée ici, `var(--background-default-grey)` y
 * serait indéfinie. Ce bloc est hors cascade layer, là où le thème de Scalar
 * vit dans `@layer scalar-theme`, donc il l'emporte sans `!important`.
 */
const PAGE_CSS = `
#root-container{max-width:none;padding:0;overflow:visible}
body{
  --scalar-background-1:#fff;
  --scalar-background-2:#f6f6f6;
  --scalar-background-3:#eee;
  --scalar-color-1:#3a3a3a;
  --scalar-color-2:#666;
  --scalar-color-3:#929292;
  --scalar-color-accent:#000091;
  --scalar-border-color:#ddd;
  --scalar-color-green:#18753c;
  --scalar-color-red:#ce0500;
  --scalar-color-orange:#b34000;
  --scalar-color-blue:#0063cb;
}`;

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
      <style>{PAGE_CSS}</style>
      <div id={MOUNT_ID} />
      <Script src={SCALAR_BUNDLE} strategy="afterInteractive" onReady={mount} />
    </>
  );
}
