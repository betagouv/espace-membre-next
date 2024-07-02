exports.up = function (knex) {
    return knex.schema
        .table("incubators", function (table) {
            table.text("description");
            table.text("short_description");
            table.dropColumn("owner");
        })
        .table("startups", function (table) {
            table.renameColumn("id", "ghid");
            table.dropColumn("github");
            table.dropColumn("website");
            table
                .timestamp("updated_at")
                .defaultTo(knex.fn.now())
                .notNullable();
        })
        .createTable("startup_events", function (table) {
            table
                .uuid("uuid")
                .defaultTo(knex.raw("uuid_generate_v4()"))
                .primary();
            table.date("date").notNullable();
            table.string("name").notNullable();
            table.text("comment");
            table.uuid("startup_id").references("uuid").inTable("startups");
        })
        .table("users", function (table) {
            table.dropColumn("incubator_id");
            table
                .timestamp("updated_at")
                .defaultTo(knex.fn.now())
                .notNullable();
        })
        .then(() =>
            knex.raw(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `)
        )
        .then(() =>
            knex.raw(`
        CREATE TRIGGER update_startups_updated_at
        BEFORE UPDATE ON startups
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
      `)
        )
        .then(() =>
            knex.raw(`
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
      `)
        );
};

exports.down = function (knex) {
    return knex.schema
        .table("incubators", function (table) {
            table.dropColumn("description");
            table.dropColumn("short_description");
            table.string("owner");
        })
        .table("startups", function (table) {
            table.renameColumn("ghid", "id");
            table.string("github");
            table.string("website");
            table.dropColumn("updated_at");
        })
        .dropTable("startup_events")
        .table("users", function (table) {
            table.uuid("incubator_id").references("id").inTable("incubators");
            table.dropColumn("updated_at");
        })
        .then(() =>
            knex.raw(
                `DROP TRIGGER IF EXISTS update_startups_updated_at ON startups`
            )
        )
        .then(() =>
            knex.raw(`DROP TRIGGER IF EXISTS update_users_updated_at ON users`)
        )
        .then(() =>
            knex.raw(`DROP FUNCTION IF EXISTS update_updated_at_column`)
        );
};
