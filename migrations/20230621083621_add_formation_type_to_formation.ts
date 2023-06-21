exports.up = function(knex) {
    return knex.schema
    .alterTable('formations', (table) => {
        table.string('formation_type')
        table.string('formation_type_airtable_id')

    })
}


exports.down = function(knex) {
    return knex.schema
    .alterTable('formations', async (table) => {
        table.dropColumn('formation_type');
        table.dropColumn('formation_type_airtable_id');
    });   
}

