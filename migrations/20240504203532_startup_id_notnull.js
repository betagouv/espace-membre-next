exports.up = async function(knex) {
    await knex("startups").whereNull("id").update({
        id: "",
    });
    return knex.schema.table("startups", function (table) {
        table.string("id").notNullable().alter();
    });
}

exports.down = function(knex) {
    return knex.schema.table("startups", function (table) {
        table.string("id").nullable().alter();
    });
}
