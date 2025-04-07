exports.up = async function (knex) {
    await knex.schema.createTable("user_events", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()")); // UUID pour l'identifiant unique
        table.string("field_id").notNullable(); // event field Id
        table.datetime("date").nullable(); // date, update date or manually added date
        table.uuid("user_id").notNullable(); // user's uuid

        // Clé étrangère vers la table startups
        table
            .foreign("user_id")
            .references("uuid")
            .inTable("users")
            .onDelete("CASCADE");

        table.timestamps(true, true); // Champs created_at et updated_at
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("user_events");
};
