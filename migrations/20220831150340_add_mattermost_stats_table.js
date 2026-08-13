
exports.up = function(knex) {
    return knex.schema
    .createTable('mattermost_member_infos', (table) => {
        table.text('username').defaultTo('primary')
        table.text('mattermost_user_id')
        table.date('last_active_at')
    });
}


exports.down = function(knex) {
    return knex.schema
    .dropTable('mattermost_member_infos')
}

