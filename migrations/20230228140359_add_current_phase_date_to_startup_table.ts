exports.up = function(knex) {
    return knex.schema
    .alterTable('startups', (table) => {
        table.date('current_phase_date')
    })
}


exports.down = function(knex) {
    return knex.schema
    .alterTable('startups', async (table) => {
        table.dropColumn('current_phase_date');
    });   
}

