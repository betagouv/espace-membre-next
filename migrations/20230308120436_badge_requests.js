exports.up = function(knex) {
    return knex.schema
    .createTable('badge_requests', (table) => {
        table.increments('id').defaultTo('primary')
        table.text('status')
        table.datetime('start_date').notNullable();
        table.datetime('end_date').notNullable();
        table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
        table.text('request_id').notNullable()
        table.text('username').notNullable()
    });
}

exports.down = function(knex) {
    return knex.schema.dropTable('badge_requests')
}

