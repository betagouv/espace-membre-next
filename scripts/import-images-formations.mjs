/**
 * Importe les illustrations des formations depuis Airtable vers la table
 * `Images` du document Grist.
 *
 * Airtable a servi de base aux formations avant Grist : ses visuels sont déjà
 * dessinés, déjà validés, et couvrent les thématiques du catalogue. Les
 * reprendre évite de repartir de rien.
 *
 * Le script est idempotent : une illustration déjà présente, reconnue à son
 * nom, est laissée telle quelle. On peut donc le relancer après un ajout côté
 * Airtable.
 *
 *   node scripts/import-images-formations.mjs [--dry-run]
 */
import { readFileSync } from "node:fs";

const DRY_RUN = process.argv.includes("--dry-run");

// Le script tourne hors de Next : il lit le .env lui-même.
const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const at = line.indexOf("=");
      return [
        line.slice(0, at).trim(),
        line
          .slice(at + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);

const {
  AIRTABLE_API_KEY,
  AIRTABLE_FORMATION_BASE_ID,
  GRIST_API_URL = "https://grist.numerique.gouv.fr/api",
  GRIST_API_KEY,
  GRIST_FORMATIONS_DOC_ID,
} = env;

// La table des types de formation : c'est elle qui porte les illustrations
// réutilisables, une par thème, là où la table des formations porte des
// visuels ponctuels.
const TABLE_TYPES = "tblzpEDz5PGe1XNXf";
const IMAGES_TABLE = env.GRIST_FORMATIONS_IMAGES_TABLE_ID || "Images";

for (const [nom, valeur] of Object.entries({
  AIRTABLE_API_KEY,
  AIRTABLE_FORMATION_BASE_ID,
  GRIST_API_KEY,
  GRIST_FORMATIONS_DOC_ID,
})) {
  if (!valeur || valeur === "xxx") {
    console.error(`${nom} n'est pas configuré dans .env`);
    process.exit(1);
  }
}

const airtable = async (path) => {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_FORMATION_BASE_ID}${path}`,
    { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } },
  );
  if (!response.ok) {
    throw new Error(`Airtable ${response.status}: ${await response.text()}`);
  }
  return response.json();
};

const grist = async (path, init = {}) => {
  const response = await fetch(`${GRIST_API_URL}/docs/${GRIST_FORMATIONS_DOC_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GRIST_API_KEY}`,
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Grist ${response.status}: ${await response.text()}`);
  }
  const text = await response.text();
  return text.trim() ? JSON.parse(text) : null;
};

/**
 * Nom lisible pour une illustration.
 *
 * Beaucoup de fichiers s'appellent « download.png », « image (3).png » ou
 * portent une capture d'écran horodatée : le nom du type de formation qui les
 * utilise dit bien mieux ce qu'on voit.
 */
const nommer = (fichier, exemple) => {
  const sansExtension = fichier.replace(/\.[a-z0-9]+$/i, "");
  const illisible =
    /^(download|image ?\(?\d*\)?|screenshot|capture|img[-_ ]?\d+)/i.test(
      sansExtension,
    ) ||
    /unsplash/i.test(sansExtension) ||
    /^[A-Za-z0-9_-]{24,}$/.test(sansExtension) ||
    // Un long mot sans espace est un nom de fichier collé, pas un titre :
    // « Universitedetedu15au22 » ne dit rien à personne.
    /[^\s]{18,}/.test(sansExtension.replace(/[-_]+/g, " "));
  const propre = sansExtension
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const nom = (illisible ? exemple || propre : propre).trim();
  return nom.charAt(0).toUpperCase() + nom.slice(1);
};

const main = async () => {
  // Toutes les pages de la table des types.
  const lignes = [];
  let offset;
  do {
    const page = await airtable(
      `/${TABLE_TYPES}?pageSize=100${offset ? `&offset=${offset}` : ""}`,
    );
    lignes.push(...page.records);
    offset = page.offset;
  } while (offset);
  console.log(`Airtable : ${lignes.length} types de formation`);

  // Un même visuel est réimporté d'un type à l'autre : on ne garde qu'une
  // entrée par nom de fichier.
  const parFichier = new Map();
  for (const ligne of lignes) {
    for (const piece of ligne.fields.Image ?? []) {
      if (!piece.type?.startsWith("image/")) continue;
      const cle = (piece.filename ?? "").toLowerCase().replace(/\s+/g, "");
      if (!parFichier.has(cle)) {
        parFichier.set(cle, {
          fichier: piece.filename,
          url: piece.url,
          type: piece.type,
          categories: new Set(),
          exemple: ligne.fields.Formation,
        });
      }
      for (const categorie of ligne.fields["Catégorie"] ?? []) {
        parFichier.get(cle).categories.add(categorie);
      }
    }
  }
  console.log(`${parFichier.size} illustrations uniques`);

  const existantes = new Set(
    (await grist(`/tables/${IMAGES_TABLE}/records`)).records.map((r) =>
      String(r.fields.Nom ?? "").toLowerCase(),
    ),
  );

  let importees = 0;
  let ignorees = 0;
  for (const image of parFichier.values()) {
    const nom = nommer(image.fichier, image.exemple);
    if (existantes.has(nom.toLowerCase())) {
      ignorees += 1;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [simulation] ${nom} — ${[...image.categories].join(", ")}`);
      importees += 1;
      continue;
    }

    // L'URL de pièce jointe est signée et de courte durée : on télécharge tout
    // de suite, sans la stocker.
    const fichier = await fetch(image.url);
    if (!fichier.ok) {
      console.warn(`  ${nom} : téléchargement impossible (${fichier.status})`);
      continue;
    }
    const contenu = new Uint8Array(await fichier.arrayBuffer());

    const formData = new FormData();
    formData.append(
      "upload",
      new Blob([contenu], { type: image.type }),
      image.fichier,
    );
    const [attachmentId] = await grist("/attachments", {
      method: "POST",
      body: formData,
    });

    await grist(`/tables/${IMAGES_TABLE}/records`, {
      method: "POST",
      body: JSON.stringify({
        records: [
          {
            fields: {
              Nom: nom,
              Categorie: [...image.categories].join(", "),
              Image: ["L", attachmentId],
              Active: true,
            },
          },
        ],
      }),
    });
    console.log(`  + ${nom} — ${[...image.categories].join(", ") || "sans catégorie"}`);
    importees += 1;
  }

  console.log(
    `${importees} illustration(s) ${DRY_RUN ? "à importer" : "importées"}, ${ignorees} déjà présente(s).`,
  );
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
