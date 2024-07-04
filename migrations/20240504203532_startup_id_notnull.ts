export async function up(knex) {
    await knex("startups").whereNull("id").update({
        id: "",
    });
    return knex.schema.table("startups", function (table) {
        table.string("id").notNullable().alter();
    });
}

export async function down(knex) {
    return knex.schema.table("startups", function (table) {
        table.string("id").nullable().alter();
    });
}
