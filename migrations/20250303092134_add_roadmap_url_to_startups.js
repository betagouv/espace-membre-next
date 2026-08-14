exports.up = function (knex) {
    return knex.schema.alterTable("startups", function (table) {
        table.string("roadmap_url").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("startups", function (table) {
        table.dropColumn("roadmap_url");
    });
};
