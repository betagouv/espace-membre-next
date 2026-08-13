
exports.up = function(knex) {
    return knex.schema.table('users', (table) => {
        table.float('average_nb_of_days')
    })
}

exports.down = function(knex) {
    return knex.schema.table('users', (table) => {
        table.dropColumn('average_nb_of_days')
    });
}

