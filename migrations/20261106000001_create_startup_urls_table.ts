// Ordre de reprise des colonnes historiques : il fixe la position initiale des
// liens, donc l'ordre d'affichage tant que personne n'a réordonné la liste.
const LEGACY_COLUMNS = [
  { column: "link", type: "website" },
  { column: "repository", type: "repository" },
  { column: "stats_url", type: "stats" },
  { column: "budget_url", type: "budget" },
  { column: "roadmap_url", type: "roadmap" },
  { column: "dashlord_url", type: "dashlord" },
  { column: "ecodesign_url", type: "ecodesign" },
  { column: "tech_audit_url", type: "tech_audit" },
  { column: "impact_url", type: "impact" },
  { column: "analyse_risques_url", type: "analyse_risques" },
];

// A garder aligné sur STARTUP_URL_TYPES et SINGLE_STARTUP_URL_TYPES
// (src/models/startupUrl.ts).
const TYPES = [
  ...LEGACY_COLUMNS.map(({ type }) => type),
  "tool",
  "demo",
  "support",
  "other",
];
const SINGLE_TYPES = [
  "stats",
  "budget",
  "roadmap",
  "dashlord",
  "ecodesign",
  "tech_audit",
  "impact",
  "analyse_risques",
];

const sqlList = (values) => values.map((value) => `'${value}'`).join(", ");

export async function up(knex) {
  await knex.schema.createTable("startup_urls", (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("startup_uuid")
      .notNullable()
      .references("uuid")
      .inTable("startups")
      .onDelete("CASCADE");
    table.text("type").notNullable();
    table.text("label").nullable();
    table.text("url").notNullable();
    table.integer("position").notNullable().defaultTo(0);
    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table.index(["startup_uuid", "position"]);
  });

  await knex.raw(`
        ALTER TABLE startup_urls
            ADD CONSTRAINT chk_startup_urls_type CHECK (type IN (${sqlList(TYPES)})),
            ADD CONSTRAINT chk_startup_urls_url_not_blank CHECK (btrim(url) <> '');
        CREATE UNIQUE INDEX uniq_startup_urls_single_type
            ON startup_urls (startup_uuid, type)
            WHERE type IN (${sqlList(SINGLE_TYPES)});
    `);

  for (const [position, { column, type }] of LEGACY_COLUMNS.entries()) {
    await knex.raw(
      `
            INSERT INTO startup_urls (startup_uuid, type, url, position)
            SELECT uuid, ?, btrim(${column}), ?
            FROM startups
            WHERE btrim(coalesce(${column}, '')) <> ''
        `,
      [type, position],
    );
  }
}

export async function down(knex) {
  // Les colonnes historiques sont tenues en miroir à chaque écriture : elles
  // portent déjà la bonne valeur, il suffit de supprimer la table.
  await knex.schema.dropTableIfExists("startup_urls");
}
