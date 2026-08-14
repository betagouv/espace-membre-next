
exports.up = function(knex) {
    return knex.schema
    .createTable('pull_requests', (table) => {
        table.text('url').defaultTo('primary')
        table.text('username')
        table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
        table.text('status').defaultTo('PR_CREATED')
    });
}

exports.down = function(knex) {
    return knex.schema.dropTable('pull_requests')
}

