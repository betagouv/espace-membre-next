export async function up(knex) {
    await knex("users").whereNull("fullname").update({
        fullname: "",
    });
    return knex.schema.table("users", function (table) {
        table.string("fullname").notNullable().alter();
    });
}

export async function down(knex) {
    return knex.schema.table("users", function (table) {
        table.string("fullname").nullable().alter();
    });
}
