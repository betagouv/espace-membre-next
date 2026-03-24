exports.up = function (knex) {
    return knex.schema.table("newsletters", function (table) {
        table.dropColumn("url");
        table.dropColumn("brevo_url");
        table.dropColumn("validator");
        table.dropColumn("year_week");
    });
};

exports.down = function (knex) {
    return knex.schema.table("newsletters", function (table) {
        table.string("url");
        table.string("brevo_url").nullable();
        table.string("validator").nullable();
        table.string("year_week").nullable();
    });
};
