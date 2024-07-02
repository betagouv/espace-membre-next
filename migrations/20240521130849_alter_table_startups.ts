export async function up(knex) {
    return knex.schema.alterTable("startups", (table) => {
        table.dropColumns(
            "nb_active_members",
            "nb_total_members",
            "last_github_update",
            "current_phase",
            "current_phase_date",
            "phases",
            "has_intra",
            "has_coach",
            "incubator"
        );
        table.renameColumn("content_url_encoded_markdown", "description");
        table.boolean("mon_service_securise");
        table.jsonb("techno");
        table.jsonb("thematiques");
        table.jsonb("usertypes");
    });
}

export async function down(knex) {
    return knex.schema
        .alterTable("startups", (table) => {
            table.dropColumn("mon_service_securise");
            table.dropColumn("techno");
            table.dropColumn("thematiques");

            table.dropColumn("usertypes");

            // Drop the enum type
            table.renameColumn("description", "content_url_encoded_markdown");

            // Add back the dropped columns
            table.integer("nb_active_members");
            table.integer("nb_total_members");
            table.timestamp("last_github_update");
            table.string("current_phase");
            table.date("current_phase_date");
            table.json("phases");
            table.boolean("has_intra");
            table.boolean("has_coach");
            table.string("incubator");
        })
        .then(() => {
            // Drop the enum type
            return knex.raw("DROP TYPE IF EXISTS usertypes_enum");
        });
}
