
exports.up = function(knex) {
    return knex.schema.table('users', (table) => {
        table.boolean('should_create_marrainage').defaultTo(true);
    })
}

exports.down = function(knex) {
    return knex.schema.table('users', (table) => {
        table.dropColumn('should_create_marrainage')
    })
}

