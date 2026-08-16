import { publicApiV1 } from "@/lib/api/withApiV1";

// Page statique : elle ne depend que de la spec, servie a cote.
export const dynamic = "force-static";

// unpkg.com est deja autorise par la CSP du projet, en script-src comme en
// style-src. La spec est chargee en same-origin, couvert par connect-src 'self'.
// withDefaultFonts: false coupe le telechargement des polices du CDN Scalar,
// donc aucune requete vers font-src. On pointe la Marianne deja servie par le
// DSFR, ce qui aligne la doc sur le reste de l'espace membre sans dependance.
// Chemin explicite du bundle autonome : le point d'entree par defaut du paquet
// est un module ESM (dist/index.js commence par `import ...`), qu'un
// <script src> classique refuse avec « Cannot use import statement outside a
// module », ce qui rendrait la page entierement blanche.
const SCALAR_BUNDLE =
  "https://unpkg.com/@scalar/api-reference/dist/browser/standalone.js";

const PAGE = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Espace Membre</title>
    <style>
      body { margin: 0; }
      :root {
        --scalar-font: "Marianne", system-ui, sans-serif;
        --scalar-font-code: "Roboto Mono", ui-monospace, monospace;
      }
    </style>
  </head>
  <body>
    <script id="api-reference" data-url="/api/v1/openapi.json"></script>
    <script>
      var configuration = {
        withDefaultFonts: false,
        // Share et Deploy ne sont pas deux widgets separes, ce sont les deux
        // enfants du panneau Developer Tools : une seule option les eteint.
        // Le defaut vaut "localhost", donc la barre est deja absente en
        // production, mais la detection retombe sur "affiche" quand l'URL
        // n'est pas analysable. "never" rend le comportement deterministe.
        showDeveloperTools: "never",
        // « Powered by Scalar » n'a AUCUNE option, a aucun palier commercial :
        // le lien est rendu sans condition. Le CSS est la seule voie. Les deux
        // selecteurs sont des classes litterales et un href, pas des hash de
        // build ; le data-v-* voisin, lui, change a chaque version.
        customCss:
          ".api-reference-toolbar{display:none!important}" +
          " .darklight-reference a[href='https://www.scalar.com']{display:none!important}",
      };
      document.getElementById("api-reference")
        .dataset.configuration = JSON.stringify(configuration);
    </script>
    <script src="${SCALAR_BUNDLE}"></script>
  </body>
</html>`;

export const GET = publicApiV1(
  async () =>
    new Response(PAGE, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
);
