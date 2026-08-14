exports.up = async function(knex) {
    await knex("startups").whereNull("name").update({
        id: "",
    });
    return knex.schema.table("startups", function (table) {
        table.string("name").notNullable().alter();
    });
}

exports.down = function(knex) {
    return knex.schema.table("startups", function (table) {
        table.string("name").nullable().alter();
    });
}
