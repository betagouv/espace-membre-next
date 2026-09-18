export async function up(knex) {
    await knex.schema.createTable("api_keys", function (table) {
        table
            .uuid("uuid")
            .notNullable()
            .defaultTo(knex.raw("uuid_generate_v4()"))
            .primary();

        table.text("kind").notNullable();
        table.text("name").notNullable();

        // hashToken(token, SESSION_SECRET). Le jeton clair n'est jamais stocke,
        // token_prefix est le seul affichage ulterieur possible.
        table.text("token_hash").notNullable().unique();
        table.text("token_prefix").notNullable();

        table
            .uuid("owner_user_id")
            .references("uuid")
            .inTable("users")
            .onDelete("CASCADE");
        table
            .uuid("owner_incubator_id")
            .references("uuid")
            .inTable("incubators")
            .onDelete("CASCADE");

        table.specificType("scopes", "text[]").notNullable();

        // Deux perimetres independants, stockes en couple (kind, id) SANS clef
        // etrangere : la cible peut disparaitre, le balayage quotidien revoque.
        table.text("read_perimeter_kind").notNullable();
        table.uuid("read_perimeter_id");
        table.text("write_perimeter_kind");
        table.uuid("write_perimeter_id");

        table.timestamp("expires_at", { useTz: true });
        table.timestamp("last_used_at", { useTz: true });
        table.timestamp("reminder_last_sent_at", { useTz: true });
        table.integer("reminder_stage").notNullable().defaultTo(0);

        table.timestamp("revoked_at", { useTz: true });
        table
            .uuid("revoked_by_user_id")
            .references("uuid")
            .inTable("users")
            .onDelete("SET NULL");
        table.text("revoked_reason");

        table
            .uuid("created_by_user_id")
            .notNullable()
            .references("uuid")
            .inTable("users")
            .onDelete("RESTRICT");

        table
            .timestamp("created_at", { useTz: true })
            .notNullable()
            .defaultTo(knex.fn.now());
        table
            .timestamp("updated_at", { useTz: true })
            .notNullable()
            .defaultTo(knex.fn.now());
    });

    await knex.raw(`
        ALTER TABLE api_keys
            ADD CONSTRAINT chk_api_keys_kind
                CHECK (kind IN ('personal', 'service')),

            ADD CONSTRAINT chk_api_keys_owner
                CHECK (
                    (kind = 'personal'
                        AND owner_user_id IS NOT NULL
                        AND owner_incubator_id IS NULL)
                    OR
                    (kind = 'service' AND owner_user_id IS NULL)
                ),

            ADD CONSTRAINT chk_api_keys_token_prefix
                CHECK (token_prefix ~ '^em1_[A-Za-z0-9_-]{8}$'),

            ADD CONSTRAINT chk_api_keys_scopes
                CHECK (
                    array_length(scopes, 1) >= 1
                    AND scopes <@ ARRAY[
                        'members:read','startups:read','incubators:read',
                        'startups:write','incubators:write'
                    ]::text[]
                ),

            ADD CONSTRAINT chk_api_keys_read_perimeter
                CHECK (
                    (read_perimeter_kind = 'global' AND read_perimeter_id IS NULL)
                    OR (read_perimeter_kind IN ('incubator','startup')
                        AND read_perimeter_id IS NOT NULL)
                ),

            ADD CONSTRAINT chk_api_keys_write_perimeter
                CHECK (
                    (write_perimeter_kind IS NULL AND write_perimeter_id IS NULL)
                    OR (write_perimeter_kind = 'global' AND write_perimeter_id IS NULL)
                    OR (write_perimeter_kind IN ('incubator','startup')
                        AND write_perimeter_id IS NOT NULL)
                ),

            ADD CONSTRAINT chk_api_keys_write_needs_perimeter
                CHECK (
                    NOT (scopes && ARRAY['startups:write','incubators:write']::text[])
                    OR write_perimeter_kind IS NOT NULL
                ),

            ADD CONSTRAINT chk_api_keys_revocation
                CHECK (
                    (revoked_at IS NULL AND revoked_reason IS NULL)
                    OR (revoked_at IS NOT NULL AND revoked_reason IS NOT NULL)
                ),

            ADD CONSTRAINT chk_api_keys_reminder_stage
                CHECK (reminder_stage BETWEEN 0 AND 2);
    `);

    // Index partiels : toutes les lectures chaudes ne portent que sur les clefs
    // vivantes, et la table conserve les revoquees indefiniment.
    await knex.raw(`
        CREATE INDEX idx_api_keys_live_owner_user
            ON api_keys (owner_user_id) WHERE revoked_at IS NULL;
        CREATE INDEX idx_api_keys_live_owner_incubator
            ON api_keys (owner_incubator_id) WHERE revoked_at IS NULL;
        CREATE INDEX idx_api_keys_sweep_unused
            ON api_keys (last_used_at, created_at) WHERE revoked_at IS NULL;
        CREATE INDEX idx_api_keys_sweep_reminder
            ON api_keys (created_at, reminder_stage)
            WHERE revoked_at IS NULL AND expires_at IS NULL;
        CREATE INDEX idx_api_keys_sweep_read_perimeter
            ON api_keys (read_perimeter_kind, read_perimeter_id)
            WHERE revoked_at IS NULL AND read_perimeter_kind <> 'global';
        CREATE INDEX idx_api_keys_sweep_write_perimeter
            ON api_keys (write_perimeter_kind, write_perimeter_id)
            WHERE revoked_at IS NULL AND write_perimeter_kind IS NOT NULL
                AND write_perimeter_kind <> 'global';
    `);
}

export async function down(knex) {
    await knex.schema.dropTableIfExists("api_keys");
}
