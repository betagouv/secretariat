exports.up = function(knex) {
    return knex.schema
    .alterTable('pull_requests', (table) => {
        table.text('startup')
    })
}


exports.down = function(knex) {
    return knex.schema
    .alterTable('pull_requests', async (table) => {
        table.dropColumn('startup');
    });   
}

