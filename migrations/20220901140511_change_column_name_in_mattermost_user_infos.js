
exports.up = async function(knex) {
    await knex.schema
        .alterTable('mattermost_member_infos', (table) => {
        table.renameColumn('last_active_at', 'last_activity_at');
    })
}



exports.down = async function(knex) {
    await knex.schema
        .alterTable('mattermost_member_infos', (table) => {
        table.renameColumn('last_active_at', 'last_activity_at');
    })
}

