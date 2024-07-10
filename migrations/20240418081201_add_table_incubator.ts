exports.up = function (knex) {
    return knex.schema.createTable("incubators", function (table) {
        table
            .uuid("uuid")
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"))
            .primary();
        table.string("title").notNullable();
        table.string("ghid").unique();
        table.string("contact");
        table.string("address");
        table.text("website");
        table.text("github");
        table.string("owner");
        table.uuid("owner_id");
        table.foreign("owner_id").references("uuid").inTable("organizations"); // Clé étrangère
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("incubators");
};
