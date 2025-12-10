export async function up(knex) {
    return knex.schema.table("users", function (table) {
        table.string("primary_email").unique().alter();
        table.string("secondary_email").unique().alter();
    });
}

export async function down(knex) {
    return knex.schema.table("users", function (table) {
        table.string("primary_email").dropUnique().alter();
        table.string("secondary_email").dropUnique().alter();
    });
}
