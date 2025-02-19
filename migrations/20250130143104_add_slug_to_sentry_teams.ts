exports.up = function (knex) {
    return knex.schema.alterTable("sentry_teams", function (table) {
        table.string("slug").unique();
    });
};

exports.down = function (knex) {
    return knex.schema.table("sentry_teams", function (table) {
        table.dropColumn("slug");
    });
};
