export async function up(knex) {
    return knex.schema.alterTable("users", (table) => {
        table.dropColumn("startups");
        table.dropColumn("missions");
        table.dropColumn("should_create_marrainage");
        table.dropColumn("nb_days_at_beta");
        table.dropColumn("memberType");
        table.uuid("incubator_id");
        table.foreign("incubator_id").references("uuid").inTable("incubators");
        table.jsonb("skills");
    });
}

export async function down(knex) {
    return knex.schema.alterTable("users", (table) => {
        table.dropColumn("incubator_id");
        table.dropColumn("skills");

        // Re-add the previously dropped columns
        table.json("startups");
        table.json("missions");
        table.boolean("should_create_marrainage");
        table.integer("nb_days_at_beta");
        table.string("memberType");
    });
}
