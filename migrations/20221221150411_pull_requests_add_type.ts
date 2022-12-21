exports.up = function(knex) {
    return knex.schema
    .alterTable('pull_requests', (table) => {
        table.text('type').defaultTo('PR_TYPE_ONBOARDING')
    })
}


exports.down = function(knex) {
    return knex.schema
    .alterTable('pull_requests', async (table) => {
        table.dropColumn('type');
    });   
}

