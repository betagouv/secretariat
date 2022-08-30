
export async function up(knex) {
    return knex.schema.table('users', (table) => {
        table.integer('average_nb_of_days')
    })
}

export async function down(knex) {
    return knex.schema.table('users', (table) => {
        table.dropColumn('average_nb_of_days')
    });
}

