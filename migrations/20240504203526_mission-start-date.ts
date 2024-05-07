export async function up(knex) {
    return knex.schema.table("missions", function (table) {
        table.date("start").notNullable().alter();
    });
}

export async function down(knex) {
    return knex.schema.table("missions", function (table) {
        table.string("start").nullable().alter();
    });
}
