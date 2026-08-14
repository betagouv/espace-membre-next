exports.up = function (knex) {
    return knex.schema.alterTable("startups", function (table) {
        table.boolean("has_mobile_app").nullable().defaultTo(false);
        table.boolean("is_private_url").nullable().defaultTo(false);
    });
};

exports.down = function (knex) {
    return knex.schema.table("startups", function (table) {
        table.dropColumn("has_mobile_app");
        table.dropColumn("is_private_url");
    });
};
