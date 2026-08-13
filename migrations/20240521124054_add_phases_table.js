export async function up(knex) {
    await knex.raw("DROP TYPE IF EXISTS startups_phase_enum");
    await knex.schema.createTable("phases", function (table) {
        table
            .uuid("uuid")
            .primary()
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"));
        table.datetime("start").notNullable();
        table.datetime("end");
        table.text("comment");
        table
            .enu(
                "name",
                [
                    "investigation",
                    "construction",
                    "acceleration",
                    "transfer",
                    "success",
                    "alumni",
                ],
                {
                    useNative: true,
                    enumName: "startups_phase_enum",
                }
            )
            .notNullable();
        table.uuid("startup_id").notNullable();
        table
            .foreign("startup_id")
            .references("uuid")
            .inTable("startups")
            .onDelete("CASCADE");
        table.unique(["startup_id", "name"]);
    });
    return knex.raw(`
ALTER TABLE phases ADD CONSTRAINT startups_phase_check CHECK ("start" < "end");
`);
}

export async function down(knex) {
    await knex.schema.dropTable("phases");
    return knex.raw("DROP TYPE IF EXISTS startups_phase_enum");
}
