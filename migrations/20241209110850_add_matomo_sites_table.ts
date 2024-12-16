exports.up = async function (knex) {
    await knex.schema.createTable("matomo_sites", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()")); // UUID pour l'identifiant unique
        table.integer("matomo_id").notNullable().unique(); // Identifiant de site Matomo
        table.uuid("startup_id").nullable(); // UUID lié à la table startups
        table.string("name").notNullable(); // Nom de du site
        table.text("url").nullable();
        table.string("type").notNullable(); // Type de du site (ex: website)

        // Clé étrangère vers la table startups
        table
            .foreign("startup_id")
            .references("uuid")
            .inTable("startups")
            .onDelete("CASCADE");

        table.timestamps(true, true); // Champs created_at et updated_at
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("matomo_sites");
};
