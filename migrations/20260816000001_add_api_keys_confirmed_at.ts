export async function up(knex) {
    await knex.schema.alterTable("api_keys", function (table) {
        // Derniere confirmation par le porteur. NULL = jamais confirmee, l'echeance
        // des rappels se compte alors depuis created_at seul.
        table.timestamp("confirmed_at", { useTz: true });
    });

    // L'index de balayage des rappels doit porter la colonne qui entre desormais
    // dans le predicat d'echeance, sinon il cesse de le couvrir.
    await knex.raw(`
        DROP INDEX IF EXISTS idx_api_keys_sweep_reminder;
        CREATE INDEX idx_api_keys_sweep_reminder
            ON api_keys (created_at, confirmed_at, reminder_stage)
            WHERE revoked_at IS NULL AND expires_at IS NULL;
    `);

    // Une confirmation ne peut pas preceder la creation : sans ce CHECK, un
    // confirmed_at anterieur rendrait GREATEST inutile et masquerait le defaut.
    await knex.raw(`
        ALTER TABLE api_keys
            ADD CONSTRAINT chk_api_keys_confirmed_at
                CHECK (confirmed_at IS NULL OR confirmed_at >= created_at);
    `);
}

export async function down(knex) {
    await knex.raw(`
        ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS chk_api_keys_confirmed_at;
        DROP INDEX IF EXISTS idx_api_keys_sweep_reminder;
    `);
    await knex.schema.alterTable("api_keys", function (table) {
        table.dropColumn("confirmed_at");
    });
    await knex.raw(`
        CREATE INDEX idx_api_keys_sweep_reminder
            ON api_keys (created_at, reminder_stage)
            WHERE revoked_at IS NULL AND expires_at IS NULL;
    `);
}
