exports.up = function(knex) {
    return knex.schema
    .alterTable('pull_requests', (table) => {
        table.jsonb('info');
    })
}


exports.down = function(knex) {
    return knex.schema
    .alterTable('pull_requests', async (table) => {
        table.dropColumn('info');
    });   
}

