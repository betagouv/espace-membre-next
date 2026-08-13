exports.up = async function(knex) {
    await knex("users").whereNull("domaine").update({
        domaine: "",
    });
    return knex.schema.table("users", function (table) {
        table.string("domaine").notNullable().alter();
    });
}

exports.down = function(knex) {
    return knex.schema.table("users", function (table) {
        table.string("domaine").nullable().alter();
    });
}
