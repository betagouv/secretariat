exports.up = function(knex) {
    return knex.schema
        .alterTable('user_details', (table) => {
            table.integer('nb_days_at_beta')
        })
}

exports.down = function(knex) {
    return knex.schema
        .alterTable('user_details', async (table) => {
            table.dropColumn('nb_days_at_beta');
        });   
}
