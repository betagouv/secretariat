
export async function up(knex) {
    await knex.schema
        .alterTable('mattermost_member_infos', (table) => {
        table.renameColumn('last_active_at', 'last_activity_at');
    })
}



export async function down(knex) {
    await knex.schema
        .alterTable('mattermost_member_infos', (table) => {
        table.renameColumn('last_active_at', 'last_activity_at');
    })
}

