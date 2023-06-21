exports.up = function(knex) {
    return knex.schema
    .alterTable('startups', (table) => {
        table.boolean('has_coach')
        table.boolean('has_intra')
    })
}


exports.down = function(knex) {
    return knex.schema
    .alterTable('startups', async (table) => {
        table.dropColumn('has_coach');
        table.dropColumn('has_intra');
    });   
}

