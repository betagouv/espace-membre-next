exports.up = function (knex) {
    return knex.schema.createTable("startups_organizations", function (table) {
        table
            .uuid("uuid")
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"))
            .primary();
        table
            .uuid("startup_id")
            .notNullable()
            .references("uuid")
            .inTable("startups")
            .onDelete("CASCADE");
        table
            .uuid("organization_id")
            .notNullable()
            .references("uuid")
            .inTable("organizations")
            .onDelete("CASCADE");
        table.unique(["startup_id", "organization_id"]);
        // You can add additional columns here if there are other attributes to this relationship
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("startups_organizations");
};
