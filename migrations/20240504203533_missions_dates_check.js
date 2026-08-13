exports.up = function(knex) {
    return knex.raw(`
        ALTER TABLE missions ADD CONSTRAINT missions_dates_check CHECK ("start" < "end");
    `);
}

exports.down = function(knex) {
    return knex.raw(`
        ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_dates_check;
    `);
}
