exports.up = async function (knex) {
    await knex.raw(`
        ALTER TABLE events ADD COLUMN action_metadata_json jsonb;
        UPDATE events SET action_metadata_json = hstore_to_jsonb(action_metadata) WHERE action_metadata IS NOT NULL;
        ALTER TABLE events DROP COLUMN action_metadata;
        ALTER TABLE events RENAME COLUMN action_metadata_json TO action_metadata;
    `);
};

exports.down = async function (knex) {
    await knex.raw(`
        ALTER TABLE events ADD COLUMN action_metadata_hstore hstore;
        UPDATE events SET action_metadata_hstore = (
            SELECT hstore(array_agg(key), array_agg(value))
            FROM jsonb_each_text(action_metadata)
        ) WHERE action_metadata IS NOT NULL;
        ALTER TABLE events DROP COLUMN action_metadata;
        ALTER TABLE events RENAME COLUMN action_metadata_hstore TO action_metadata;
    `);
};
