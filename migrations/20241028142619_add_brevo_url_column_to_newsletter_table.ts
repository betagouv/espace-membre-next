exports.up = function (knex) {
    return knex.schema.table("newsletters", function (table) {
        table.text("brevo_url");
    });
};

exports.down = function (knex) {
    return knex.schema.table("newsletters", function (table) {
        // Drop the column if rolling back the migration
        table.dropColumn("brevo_url");
    });
};
