exports.up = function(knex) {
    return knex.schema
    .alterTable('formations', async (table) => {
        table.dropColumn('nb_active_members');
        table.dropColumn('nb_total_members');
    });  
}

exports.down = function(knex) {
    return knex.schema
    .alterTable('formations', async (table) => {
        table.integer('nb_active_members');
        table.integer('nb_total_members');
    });  
}
