export async function up(knex) {
    await knex.schema.createTable("startups_incubators", function (table) {
        table
            .uuid("uuid")
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"))
            .primary();
        table
            .uuid("startup_id")
            .notNullable()
            .references("uuid")
            .inTable("startups")
            .onDelete("CASCADE");
        table
            .uuid("incubator_id")
            .notNullable()
            .references("uuid")
            .inTable("incubators")
            .onDelete("CASCADE");
        table.unique(["startup_id", "incubator_id"]);
    });

    // Backfill the join table from the existing primary incubator so the
    // N:N relation is a strict superset of the legacy incubator_id column.
    await knex.raw(`
        INSERT INTO startups_incubators (startup_id, incubator_id)
        SELECT uuid, incubator_id
        FROM startups
        WHERE incubator_id IS NOT NULL
        ON CONFLICT (startup_id, incubator_id) DO NOTHING;
    `);

    // startups_incubators is the source of truth for the relation; the legacy
    // startups.incubator_id is kept only as the "primary" incubator that
    // downstream API consumers still depend on, and is therefore DERIVED: it
    // must always be one of the linked incubators. This composite FK makes the
    // database enforce that invariant so the two representations cannot drift
    // while the transition lasts. It is DEFERRED so that a single transaction
    // can rewrite the whole set of links (delete then re-insert) before the
    // check runs at commit time.
    // Dropping the primary later = drop this constraint, then drop the column.
    await knex.raw(`
        ALTER TABLE startups
        ADD CONSTRAINT startups_principal_incubator_linked
        FOREIGN KEY (uuid, incubator_id)
        REFERENCES startups_incubators (startup_id, incubator_id)
        DEFERRABLE INITIALLY DEFERRED;
    `);
}

export async function down(knex) {
    await knex.raw(`
        ALTER TABLE startups
        DROP CONSTRAINT IF EXISTS startups_principal_incubator_linked;
    `);
    await knex.schema.dropTableIfExists("startups_incubators");
}
