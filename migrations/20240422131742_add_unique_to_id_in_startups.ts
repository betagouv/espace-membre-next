export async function up(knex) {
    return knex.schema.table("startups", function (table) {
        table.string("id").unique().alter();
    });
}

export async function down(knex) {
    return knex.schema.table("startups", function (table) {
        table.string("id").dropUnique().alter();
    });
}
