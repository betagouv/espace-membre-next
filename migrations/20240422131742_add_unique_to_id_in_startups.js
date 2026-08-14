exports.up = function(knex) {
    return knex.schema.table("startups", function (table) {
        table.string("id").unique().alter();
    });
}

exports.down = function(knex) {
    return knex.schema.table("startups", function (table) {
        table.string("id").dropUnique().alter();
    });
}
