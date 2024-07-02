export async function up(knex) {
    await knex("users").whereNull("domaine").update({
        domaine: "",
    });
    return knex.schema.table("users", function (table) {
        table.string("domaine").notNullable().alter();
    });
}

export async function down(knex) {
    return knex.schema.table("users", function (table) {
        table.string("domaine").nullable().alter();
    });
}
