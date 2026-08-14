exports.up = function(knex) {
    return knex.schema.table("missions", function (table) {
        table.dropColumn("startup");
        table.dropColumn("username");
        table.dropColumn("role");
    });
}

exports.down = function(knex) {
    return knex.schema.table("missions", function (table) {
        table.text("startup");
        table.text("username");
        table.text("role");
    });
}
