exports.up = function(knex) {
    return knex.schema
        .alterTable('formations', (table) => {
            table.boolean('is_embarquement')
        })
}

exports.down = function(knex) {
    return knex.schema
        .alterTable('formations', async (table) => {
            table.boolean('is_embarquement');
        });   
}
