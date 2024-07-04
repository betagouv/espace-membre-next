export async function up(knex) {
    await knex("startups").whereNull("name").update({
        id: "",
    });
    return knex.schema.table("startups", function (table) {
        table.string("name").notNullable().alter();
    });
}

export async function down(knex) {
    return knex.schema.table("startups", function (table) {
        table.string("name").nullable().alter();
    });
}
