exports.up = async function (knex) {
    await knex.schema.createTable("dinum_emails", (table) => {
        table.uuid("uuid").primary().defaultTo(knex.raw("gen_random_uuid()")); // UUID pour l'identifiant unique
        table.string("email").notNullable().unique(); // Email
        table.string("status").nullable(); // enabled, pending
        table.timestamps(true, true); // Champs created_at et updated_at
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("dinum_emails");
};
