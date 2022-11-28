
export async function up(knex) {
    return knex.schema.table('startups', (table) => {
        table.string('mailing_list');
    })
}


export async function down(knex) {
    return knex.schema.table('startups', (table) => {
        table.dropColumn('mailing_list')
    })
}

