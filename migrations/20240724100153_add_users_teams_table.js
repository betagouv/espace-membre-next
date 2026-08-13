exports.up = function (knex) {
    return knex.schema.createTable("users_teams", function (table) {
        table
            .uuid("uuid")
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"))
            .primary();
        table
            .uuid("user_id")
            .notNullable()
            .references("uuid")
            .inTable("users")
            .onDelete("CASCADE");
        table
            .uuid("team_id")
            .notNullable()
            .references("uuid")
            .inTable("teams")
            .onDelete("CASCADE");
        table.unique(["user_id", "team_id"]);
        // You can add additional columns here if there are other attributes to this relationship
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("users_teams");
};
