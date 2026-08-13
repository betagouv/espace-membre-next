exports.up = function(knex) {
    return knex.schema.table("missions", function (table) {
        table.date("start").notNullable().alter();
    });
}

exports.down = function(knex) {
    return knex.schema.table("missions", function (table) {
        table.string("start").nullable().alter();
    });
}
