export async function up(knex) {
    knex.schema.createTable("events", (table) => {
        table
            .uuid("uuid")
            .primary()
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"));
        table.datetime("date").notNullable();
        table.string("name").notNullable();
        table.text("comment");
        table.jsonb("data");
        table.uuid("startup_id");
        table
            .foreign("startup_id")
            .references("uuid")
            .inTable("startups")
            .onDelete("CASCADE");
    });
}

export async function down(knex) {
    await knex.schema.dropTable("events");
}
