exports.up = async function (knex) {
    await knex.schema.createTable("sentry_teams", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()")); // UUID pour l'identifiant unique
        table.string("sentry_id").notNullable().unique(); // Identifiant de team Sentry
        table.uuid("startup_id").nullable(); // UUID lié à la table startups
        table.string("name").notNullable(); // Nom de l'équipe

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
    await knex.schema.dropTableIfExists("sentry_teams");
};
