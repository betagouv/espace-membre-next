export async function up(knex) {
    return knex.schema.createTable("teams", (table) => {
        table
            .uuid("uuid")
            .primary()
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"));
        table.string("name").notNullable();
        table.text("mission");
        table.uuid("incubator_id").notNullable();
        table.string("ghid").unique();
        table
            .foreign("incubator_id")
            .references("uuid")
            .inTable("incubators")
            .onDelete("CASCADE");
        table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
        table.datetime("updated_at").notNullable().defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    return await knex.schema.dropTable("teams");
}
