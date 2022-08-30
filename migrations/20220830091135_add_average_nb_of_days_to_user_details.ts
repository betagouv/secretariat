
export async function up(knex) {
    return knex.schema.table('user_details', (table) => {
        table.float('average_nb_of_days')
    })
}

export async function down(knex) {
    return knex.schema.table('user_details', (table) => {
        table.dropColumn('average_nb_of_days')
    })
}

