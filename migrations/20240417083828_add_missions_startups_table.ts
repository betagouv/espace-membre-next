exports.up = function (knex) {
    return knex.schema.createTable("missions_startups", (table) => {
        table
            .uuid("uuid")
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"))
            .primary();
        table.uuid("mission_id").notNullable();
        table.uuid("startup_id").notNullable();
        table
            .foreign("mission_id")
            .references("uuid")
            .inTable("missions")
            .onDelete("CASCADE");
        table
            .foreign("startup_id")
            .references("uuid")
            .inTable("startups")
            .onDelete("CASCADE");
        table.unique(["startup_id", "mission_id"]);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("missions_startups");
};
