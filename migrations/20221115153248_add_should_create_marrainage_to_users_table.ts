
export async function up(knex) {
    return knex.schema.table('users', (table) => {
        table.boolean('should_create_marrainage').defaultTo(true);
    })
}

export async function down(knex) {
    return knex.schema.table('users', (table) => {
        table.dropColumn('should_create_marrainage')
    })
}

