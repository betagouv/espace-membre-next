export async function up(knex) {
    await knex.schema.alterTable("startups", (table) => {
        table
            .uuid("contact_dinum")
            .nullable()
            .references("uuid")
            .inTable("users");
        table
            .uuid("contact_incubator")
            .nullable()
            .references("uuid")
            .inTable("users");
    });
}

export async function down(knex) {
    await knex.schema.alterTable("startups", (table) => {
        table.dropColumn("contact_dinum");
        table.dropColumn("contact_incubator");
    });
}
