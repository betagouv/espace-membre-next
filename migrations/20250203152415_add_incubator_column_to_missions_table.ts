exports.up = function (knex) {
    return knex.schema.alterTable("missions", (table) => {
        table
            .uuid("incubator_id")
            .references("uuid")
            .inTable("incubators")
            .onDelete("CASCADE")
            .nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("missions", (table) => {
        table.dropColumn("incubator_id");
    });
};
