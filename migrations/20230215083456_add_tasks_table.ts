export async function up(knex) {
    return knex.schema
    .createTable('tasks', (table) => {
        table.text('name').primary();
        table.text('description')
        table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
        table.datetime('last_completed');
        table.datetime('last_failed');
        table.text('error_message')
    });
}

export async function down(knex){
    return knex.schema.dropTable('tasks')
}

