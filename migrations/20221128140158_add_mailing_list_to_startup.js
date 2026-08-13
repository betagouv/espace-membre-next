
exports.up = function(knex) {
    return knex.schema.table('startups', (table) => {
        table.string('mailing_list');
    })
}


exports.down = function(knex) {
    return knex.schema.table('startups', (table) => {
        table.dropColumn('mailing_list')
    })
}

