exports.up = function (knex) {
    return knex.schema.table("newsletters", function (table) {
        table.datetime("publish_at");
    });
};

exports.down = function (knex) {
    return knex.schema.table("newsletters", function (table) {
        // Drop the column if rolling back the migration
        table.dropColumn("publish_at");
    });
};
