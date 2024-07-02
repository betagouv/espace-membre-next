exports.up = function (knex) {
    return knex.schema.table("startups", function (table) {
        table.text("budget_url").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.table("startups", function (table) {
        table.dropColumn("budget_url");
    });
};
