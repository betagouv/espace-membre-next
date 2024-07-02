exports.up = async function (knex) {
    return knex.schema.createTable("organizations", function (table) {
        table
            .uuid("uuid")
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"))
            .primary();
        table.string("ghid").unique();
        table.string("name").notNullable().unique(); // Unique name
        table.string("acronym").nullable().unique(); // Unique acronym, but nullable
        table.string("domaine_ministeriel").notNullable();
        table.string("type").notNullable();
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("organizations");
};
