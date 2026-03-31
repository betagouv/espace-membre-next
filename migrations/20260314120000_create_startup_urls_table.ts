const URL_COLUMN_TYPE_MAP = [
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

export async function up(knex) {
  await knex.schema.createTable("startup_urls", (table) => {
    table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("startup_uuid")
      .notNullable()
      .references("uuid")
      .inTable("startups")
      .onDelete("CASCADE");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.text("label").nullable();
    table.text("type").notNullable();
    table.text("url").notNullable();
    table.index(["startup_uuid"]);
  });

  // Migrate existing URL columns into startup_urls
  for (const { column, type } of URL_COLUMN_TYPE_MAP) {
    await knex.raw(
      `
      INSERT INTO startup_urls (startup_uuid, type, url)
      SELECT uuid, ?, ${column}
      FROM startups
      WHERE ${column} IS NOT NULL AND ${column} != ''
    `,
      [type],
    );
  }

  // Drop migrated URL columns from startups
  //await knex.schema.alterTable("startups", (table) => {
  // table.dropColumn("link");
  // table.dropColumn("repository");
  // table.dropColumn("stats_url");
  // table.dropColumn("budget_url");
  // table.dropColumn("roadmap_url");
  // table.dropColumn("dashlord_url");
  // table.dropColumn("ecodesign_url");
  // table.dropColumn("tech_audit_url");
  // table.dropColumn("impact_url");
  // table.dropColumn("analyse_risques_url");
  // });
}

export async function down(knex) {
  // await knex.schema.alterTable("startups", (table) => {
  // table.text("link").nullable();
  // table.text("repository").nullable();
  // table.text("stats_url").nullable();
  // table.text("budget_url").nullable();
  // table.text("roadmap_url").nullable();
  // table.text("dashlord_url").nullable();
  // table.text("ecodesign_url").nullable();
  // table.text("tech_audit_url").nullable();
  // table.text("impact_url").nullable();
  // table.text("analyse_risques_url").nullable();
  //});

  // for (const { column, type } of URL_COLUMN_TYPE_MAP) {
  //   await knex.raw(
  //     `
  //     UPDATE startups s
  //     SET ${column} = su.url
  //     FROM startup_urls su
  //     WHERE su.startup_uuid = s.uuid AND su.type = ?
  //   `,
  //     [type],
  //   );
  // }

  await knex.schema.dropTableIfExists("startup_urls");
}
