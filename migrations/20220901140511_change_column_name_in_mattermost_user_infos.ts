import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema
        .alterTable('mattermost_member_infos', (table) => {
        table.renameColumn('last_activity_at', 'last_active_at');
    })
}



export async function down(knex: Knex): Promise<void> {
    await knex.schema
        .alterTable('mattermost_member_infos', (table) => {
        table.renameColumn('last_activity_at', 'last_active_at');
    })
}

