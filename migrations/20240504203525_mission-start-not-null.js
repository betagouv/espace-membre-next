export async function up(knex) {
    await knex("missions").whereNull("start").update({
        start: "1970-01-01",
    });
    return knex.schema.table("missions", function (table) {
        table.string("start").notNullable().alter();
    });
}

export async function down(knex) {
    return knex.schema.table("missions", function (table) {
        table.string("start").nullable().alter();
    });
}
