exports.up = async function(knex) {
    await knex("users").whereNull("fullname").update({
        fullname: "",
    });
    return knex.schema.table("users", function (table) {
        table.string("fullname").notNullable().alter();
    });
}

exports.down = function(knex) {
    return knex.schema.table("users", function (table) {
        table.string("fullname").nullable().alter();
    });
}
