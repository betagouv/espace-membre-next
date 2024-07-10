export async function up(knex) {
    return knex.raw(`
        ALTER TABLE missions ADD CONSTRAINT missions_dates_check CHECK ("start" < "end");
    `);
}

export async function down(knex) {
    return knex.raw(`
        ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_dates_check;
    `);
}
