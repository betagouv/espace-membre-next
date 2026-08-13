exports.up = async function(knex) {
    await knex("missions").whereNull("start").update({
        start: "1970-01-01",
    });
    return knex.schema.table("missions", function (table) {
        table.string("start").notNullable().alter();
    });
}

exports.down = function(knex) {
    return knex.schema.table("missions", function (table) {
        table.string("start").nullable().alter();
    });
}
