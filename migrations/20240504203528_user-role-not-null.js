export async function up(knex) {
    await knex("users").whereNull("role").update({
        role: "",
    });
    return knex.schema.table("users", function (table) {
        table.string("role").notNullable().alter();
    });
}

export async function down(knex) {
    return knex.schema.table("users", function (table) {
        table.string("role").nullable().alter();
    });
}
