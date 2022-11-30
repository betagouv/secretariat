
export async function up(knex) {
    return knex.schema
    .createTable('pull_requests', (table) => {
        table.text('url').defaultTo('primary')
        table.text('username')
        table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
        table.text('status').defaultTo('PR_CREATED')
    });
}

export async function down(knex){
    return knex.schema.dropTable('pull_requests')
}

