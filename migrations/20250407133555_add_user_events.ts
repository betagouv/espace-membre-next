exports.up = async function (knex) {
    await knex.schema.createTable("user_events", (table) => {
        table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()")); // UUID pour l'identifiant unique
        table.string("field_id").notNullable(); // event field Id
        table.datetime("date").notNullable();
        table.uuid("user_id").notNullable(); // user's uuid

        // Clé étrangère vers la table users
        table
            .foreign("user_id")
            .references("uuid")
            .inTable("users")
            .onDelete("CASCADE");

        table.timestamps(true, true); // Champs created_at et updated_at
        table.unique(["field_id", "user_id"]);
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists("user_events");
};
