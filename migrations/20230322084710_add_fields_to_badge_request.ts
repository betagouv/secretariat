exports.up = function(knex) {
    return knex.schema
    .alterTable('badge_requests', (table) => {
        table.string('ds_token')
        table.integer('dossier_number')
    })
}


exports.down = function(knex) {
    return knex.schema
    .alterTable('badge_requests', async (table) => {
        table.dropColumn('ds_token');
        table.dropColumn('dossier_number');
    });   
}

