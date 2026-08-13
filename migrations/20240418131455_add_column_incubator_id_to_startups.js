exports.up = function(knex) {
    return knex.schema.alterTable("startups", (table) => {
        table.uuid("incubator_id").unsigned();
        table.foreign("incubator_id").references("uuid").inTable("incubators"); // Clé étrangère
    });
}

exports.down = function(knex) {
    return knex.schema.alterTable("startups", (table) => {
        table.dropColumn("incubator_id");
    });
}
