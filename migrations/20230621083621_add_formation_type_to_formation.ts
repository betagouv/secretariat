exports.up = function(knex) {
    return knex.schema
    .alterTable('formations', (table) => {
        table.string('formation_type')
    })
}


exports.down = function(knex) {
    return knex.schema
    .alterTable('formations', async (table) => {
        table.dropColumn('formation_type');
    });   
}

