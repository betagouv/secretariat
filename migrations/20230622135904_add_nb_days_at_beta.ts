exports.up = function(knex) {
    return knex.schema
        .alterTable('users', (table) => {
            table.integer('nb_days_at_beta')
        })
}

exports.down = function(knex) {
    return knex.schema
        .alterTable('users', async (table) => {
            table.dropColumn('nb_days_at_beta');
        });   
}
