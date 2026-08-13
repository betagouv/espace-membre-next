
exports.up = function(knex) {
    return knex.schema
    .createTable('missions', (table) => {
        table.increments('id').defaultTo('primary')
        table.string('startup')
        table.string('status');
        table.text('role');
        table.string('employer');
        table.string('username');
        table.date('start');
        table.date('end');
    });
}


exports.down = function(knex) {
    return knex.schema
    .dropTable('missions')
}

