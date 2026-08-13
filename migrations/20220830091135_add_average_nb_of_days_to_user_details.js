
exports.up = function(knex) {
    return knex.schema.table('user_details', (table) => {
        table.float('average_nb_of_days')
    })
}

exports.down = function(knex) {
    return knex.schema.table('user_details', (table) => {
        table.dropColumn('average_nb_of_days')
    })
}

