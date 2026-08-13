exports.up = async function(knex) {
    await knex("users").whereNull("role").update({
        role: "",
    });
    return knex.schema.table("users", function (table) {
        table.string("role").notNullable().alter();
    });
}

exports.down = function(knex) {
    return knex.schema.table("users", function (table) {
        table.string("role").nullable().alter();
    });
}
