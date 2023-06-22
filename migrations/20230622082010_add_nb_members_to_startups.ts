exports.up = function(knex) {
    return knex.schema
        .alterTable('startups', (table) => {
            table.integer('nb_active_members')
            table.integer('nb_total_members')
            table.datetime('last_github_update')
        })
}

exports.down = function(knex) {
    return knex.schema
    .alterTable('startups', async (table) => {
        table.dropColumn('nb_active_members');
        table.dropColumn('last_github_update');
        table.dropColumn('nb_total_members')

    });   
}
