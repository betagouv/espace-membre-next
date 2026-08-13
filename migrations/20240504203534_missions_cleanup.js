export async function up(knex) {
    return knex.schema.table("missions", function (table) {
        table.dropColumn("startup");
        table.dropColumn("username");
        table.dropColumn("role");
    });
}

export async function down(knex) {
    return knex.schema.table("missions", function (table) {
        table.text("startup");
        table.text("username");
        table.text("role");
    });
}
